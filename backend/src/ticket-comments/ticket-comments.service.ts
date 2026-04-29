import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Ticket, TicketHistoryAction, TicketStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';

const fullTicketAccessRoles: UserRole[] = [UserRole.MANAGER, UserRole.SUBSTITUTE, UserRole.SECRETARY];

@Injectable()
export class TicketCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(ticketId: string, dto: CreateTicketCommentDto, user: AuthenticatedUser) {
    const [ticket, activeUser] = await Promise.all([this.findTicketOrThrow(ticketId), this.prisma.user.findUnique({ where: { id: user.sub } })]);
    if (!activeUser?.enabled) throw new ForbiddenException('User is disabled');
    this.assertCanAccessTicket(ticket, user);
    this.assertTicketIsNotClosed(ticket);

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.ticketComment.create({
        data: {
          ticketId,
          userId: user.sub,
          content: dto.content
        },
        include: this.commentInclude()
      });

      await tx.ticketHistory.create({
        data: {
          ticketId,
          userId: user.sub,
          action: TicketHistoryAction.COMMENT_ADDED,
          details: { commentId: comment.id, content: comment.content }
        }
      });

      return comment;
    });
  }

  async findCommentsByTicketId(ticketId: string, user: AuthenticatedUser) {
    const ticket = await this.findTicketOrThrow(ticketId);
    this.assertCanAccessTicket(ticket, user);

    return this.prisma.ticketComment.findMany({
      where: { ticketId, deleted: false },
      include: this.commentInclude(),
      orderBy: { createdAt: 'asc' }
    });
  }

  async updateComment(id: string, dto: UpdateTicketCommentDto, user: AuthenticatedUser) {
    const comment = await this.findCommentOrThrow(id);
    this.assertCanAccessTicket(comment.ticket, user);
    this.assertTicketIsNotClosed(comment.ticket);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticketComment.update({
        where: { id },
        data: {
          content: dto.content
        },
        include: this.commentInclude()
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: comment.ticketId,
          userId: user.sub,
          action: TicketHistoryAction.UPDATED,
          details: {
            commentId: id,
            previousContent: comment.content,
            newContent: updated.content
          }
        }
      });

      return updated;
    });
  }

  async softDeleteComment(id: string, user: AuthenticatedUser) {
    const comment = await this.findCommentOrThrow(id);
    this.assertCanAccessTicket(comment.ticket, user);
    this.assertTicketIsNotClosed(comment.ticket);

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.ticketComment.update({
        where: { id },
        data: { deleted: true },
        include: this.commentInclude()
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: comment.ticketId,
          userId: user.sub,
          action: TicketHistoryAction.UPDATED,
          details: {
            commentId: id,
            deleted: true
          }
        }
      });

      return deleted;
    });
  }

  private async findTicketOrThrow(ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, deleted: false } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private async findCommentOrThrow(id: string) {
    const comment = await this.prisma.ticketComment.findFirst({
      where: { id, deleted: false },
      include: { ticket: true }
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.ticket.deleted) throw new NotFoundException('Ticket not found');
    return comment;
  }

  private assertCanAccessTicket(ticket: Ticket, user: AuthenticatedUser) {
    if (this.isManager(user)) return;
    if (user.role === UserRole.WORKER && ticket.assignedToId === user.sub) return;
    throw new ForbiddenException('Workers can only access comments from assigned tickets');
  }

  private isManager(user: AuthenticatedUser) {
    return fullTicketAccessRoles.includes(user.role as UserRole);
  }

  private assertTicketIsNotClosed(ticket: Pick<Ticket, 'status'>) {
    if (ticket.status === TicketStatus.CLOSED) throw new BadRequestException('Closed tickets cannot be modified');
  }

  private commentInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    } satisfies Prisma.TicketCommentInclude;
  }
}
