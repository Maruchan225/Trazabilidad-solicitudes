import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StorageType, Ticket, TicketHistoryAction, TicketStatus, UserRole } from '@prisma/client';
import { relative } from 'node:path';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UploadTicketAttachmentDto } from './dto/upload-ticket-attachment.dto';

export type UploadedTicketFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

type StoredAttachmentFile = {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageType: StorageType;
  path: string;
  url: string;
};

const managerRoles: UserRole[] = [UserRole.MANAGER, UserRole.SUBSTITUTE];

@Injectable()
export class TicketAttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadAttachment(ticketId: string, file: UploadedTicketFile | undefined, dto: UploadTicketAttachmentDto, user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('File is required');

    const [ticket, activeUser] = await Promise.all([this.findTicketOrThrow(ticketId), this.prisma.user.findUnique({ where: { id: user.sub } })]);
    if (!activeUser?.enabled) throw new ForbiddenException('User is disabled');
    this.assertCanAccessTicket(ticket, user);
    if (ticket.status === TicketStatus.CLOSED && !this.isManager(user)) throw new ForbiddenException('Closed tickets cannot receive new attachments');

    const storedFile = this.prepareStoredFile(ticketId, file, dto.storageType ?? StorageType.LOCAL);

    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.ticketAttachment.create({
        data: {
          ticketId,
          uploadedById: user.sub,
          fileName: storedFile.fileName,
          originalName: storedFile.originalName,
          mimeType: storedFile.mimeType,
          size: storedFile.size,
          storageType: storedFile.storageType,
          path: storedFile.path,
          url: storedFile.url
        },
        include: this.attachmentInclude()
      });

      await tx.ticketHistory.create({
        data: {
          ticketId,
          userId: user.sub,
          action: TicketHistoryAction.ATTACHMENT_ADDED,
          details: {
            attachmentId: attachment.id,
            fileName: attachment.fileName,
            originalName: attachment.originalName
          }
        }
      });

      return attachment;
    });
  }

  async findAttachmentsByTicketId(ticketId: string, user: AuthenticatedUser) {
    const ticket = await this.findTicketOrThrow(ticketId);
    this.assertCanAccessTicket(ticket, user);

    return this.prisma.ticketAttachment.findMany({
      where: { ticketId, deleted: false },
      include: this.attachmentInclude(),
      orderBy: { createdAt: 'asc' }
    });
  }

  async softDeleteAttachment(id: string, user: AuthenticatedUser) {
    const attachment = await this.findAttachmentOrThrow(id);
    this.assertCanAccessTicket(attachment.ticket, user);

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.ticketAttachment.update({
        where: { id },
        data: { deleted: true },
        include: this.attachmentInclude()
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: attachment.ticketId,
          userId: user.sub,
          action: TicketHistoryAction.UPDATED,
          details: {
            attachmentId: id,
            deleted: true
          }
        }
      });

      return deleted;
    });
  }

  private prepareStoredFile(ticketId: string, file: UploadedTicketFile, storageType: StorageType): StoredAttachmentFile {
    if (storageType === StorageType.GOOGLE_DRIVE) {
      throw new BadRequestException('Google Drive storage is not available yet');
    }

    const storedPath = relative(process.cwd(), file.path).replace(/\\/g, '/');

    return {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageType: StorageType.LOCAL,
      path: storedPath,
      url: `/uploads/tickets/${ticketId}/${file.filename}`
    };
  }

  private async findTicketOrThrow(ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, deleted: false } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private async findAttachmentOrThrow(id: string) {
    const attachment = await this.prisma.ticketAttachment.findFirst({
      where: { id, deleted: false },
      include: { ticket: true }
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.ticket.deleted) throw new NotFoundException('Ticket not found');
    return attachment;
  }

  private assertCanAccessTicket(ticket: Ticket, user: AuthenticatedUser) {
    if (this.isManager(user)) return;
    if (user.role === UserRole.WORKER && ticket.assignedToId === user.sub) return;
    throw new ForbiddenException('Workers can only access attachments from assigned tickets');
  }

  private isManager(user: AuthenticatedUser) {
    return managerRoles.includes(user.role as UserRole);
  }

  private attachmentInclude() {
    return {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    } satisfies Prisma.TicketAttachmentInclude;
  }
}
