import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Ticket, TicketHistoryAction, TicketStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { NEAR_DUE_DAYS } from '../common/constants/sla.constants';
import { PrismaService } from '../prisma/prisma.service';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { DeriveTicketDto } from './dto/derive-ticket.dto';
import { ReopenTicketDto } from './dto/reopen-ticket.dto';
import { TicketFiltersDto } from './dto/ticket-filters.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const managerRoles: UserRole[] = [UserRole.MANAGER, UserRole.SUBSTITUTE];
const terminalStatuses: TicketStatus[] = [TicketStatus.CLOSED, TicketStatus.FINISHED];

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  calculateDueDate(createdAt: Date, appliedSlaDays: number) {
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + appliedSlaDays);
    return dueDate;
  }

  isTicketOverdue(ticket: { dueDate: Date; status: TicketStatus }) {
    return ticket.dueDate < new Date() && !terminalStatuses.includes(ticket.status);
  }

  isTicketNearDue(ticket: { dueDate: Date; status: TicketStatus }) {
    const limit = new Date();
    limit.setDate(limit.getDate() + NEAR_DUE_DAYS);
    return ticket.dueDate >= new Date() && ticket.dueDate <= limit && !terminalStatuses.includes(ticket.status);
  }

  async createTicket(dto: CreateTicketDto, user: AuthenticatedUser) {
    const [type, assignee] = await Promise.all([
      this.prisma.ticketType.findUnique({ where: { id: dto.ticketTypeId } }),
      this.prisma.user.findUnique({ where: { id: dto.assignedToId } })
    ]);
    if (!type?.active) throw new BadRequestException('Ticket type is required and must be active');
    if (!assignee?.enabled) throw new BadRequestException('Assignee must be an active user');

    const createdAt = new Date();
    const dueDate = this.calculateDueDate(createdAt, type.slaDays);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          code: dto.code,
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          inputChannel: dto.inputChannel,
          ticketTypeId: dto.ticketTypeId,
          assignedToId: dto.assignedToId,
          createdById: user.sub,
          appliedSlaDays: type.slaDays,
          dueDate,
          createdAt
        }
      });

      await this.createHistoryEntry(tx, {
        ticketId: ticket.id,
        userId: user.sub,
        action: TicketHistoryAction.CREATED,
        newStatus: ticket.status,
        newAssigneeId: ticket.assignedToId
      });

      return ticket;
    });
  }

  async findAllTickets(filters: TicketFiltersDto, user: AuthenticatedUser) {
    const where: Prisma.TicketWhereInput = this.buildTicketWhere(filters);
    if (user.role === UserRole.WORKER) where.assignedToId = user.sub;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        select: this.ticketListSelect(),
        orderBy: this.buildTicketOrderBy(filters),
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.ticket.count({ where })
    ]);
    return { items, total, page, pageSize };
  }

  async findTicketById(id: string, user: AuthenticatedUser) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, deleted: false }, include: this.ticketInclude() });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (user.role === UserRole.WORKER && ticket.assignedToId !== user.sub) throw new ForbiddenException('Workers can only view assigned tickets');
    return ticket;
  }

  async updateTicket(id: string, dto: UpdateTicketDto, user: AuthenticatedUser) {
    const ticket = await this.findEditableTicket(id, user);
    if (dto.ticketTypeId) await this.ensureTicketTypeIsActive(dto.ticketTypeId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          code: dto.code,
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          inputChannel: dto.inputChannel,
          ticketTypeId: dto.ticketTypeId
        }
      });

      await this.createHistoryEntry(tx, {
        ticketId: id,
        userId: user.sub,
        action: TicketHistoryAction.UPDATED,
        previousStatus: ticket.status,
        newStatus: updated.status,
        previousAssigneeId: ticket.assignedToId,
        newAssigneeId: updated.assignedToId,
        details: this.toJsonObject(dto as Record<string, unknown>)
      });

      return updated;
    });
  }

  async assignTicket(id: string, dto: AssignTicketDto, user: AuthenticatedUser) {
    this.assertManager(user);
    const [ticket, assignee] = await Promise.all([this.findRawTicket(id), this.prisma.user.findUnique({ where: { id: dto.assignedToId } })]);
    this.assertTicketIsNotClosed(ticket);
    if (!assignee?.enabled) throw new BadRequestException('Assignee must be active');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({ where: { id }, data: { assignedToId: dto.assignedToId } });
      await this.createHistoryEntry(tx, {
        ticketId: id,
        userId: user.sub,
        action: TicketHistoryAction.ASSIGNED,
        previousStatus: ticket.status,
        newStatus: updated.status,
        previousAssigneeId: ticket.assignedToId,
        newAssigneeId: dto.assignedToId,
        details: dto.observation ? { observation: dto.observation } : undefined
      });
      return updated;
    });
  }

  async deriveTicket(id: string, dto: DeriveTicketDto, user: AuthenticatedUser) {
    this.assertManager(user);
    const [ticket, assignee] = await Promise.all([this.findRawTicket(id), this.prisma.user.findUnique({ where: { id: dto.toUserId } })]);
    this.assertTicketIsNotClosed(ticket);
    if (!assignee?.enabled) throw new BadRequestException('Target user must be active');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({ where: { id }, data: { assignedToId: dto.toUserId, status: TicketStatus.DERIVED } });

      await tx.ticketDerivation.create({
        data: {
          ticketId: id,
          fromUserId: ticket.assignedToId,
          toUserId: dto.toUserId,
          performedById: user.sub,
          observation: dto.reason,
          previousStatus: ticket.status,
          newStatus: TicketStatus.DERIVED
        }
      });

      await this.createHistoryEntry(tx, {
        ticketId: id,
        userId: user.sub,
        action: TicketHistoryAction.DERIVED,
        previousStatus: ticket.status,
        newStatus: TicketStatus.DERIVED,
        previousAssigneeId: ticket.assignedToId,
        newAssigneeId: dto.toUserId,
        details: dto.reason ? { reason: dto.reason } : undefined
      });

      return updated;
    });
  }

  async changeTicketStatus(id: string, dto: ChangeTicketStatusDto, user: AuthenticatedUser) {
    const ticket = await this.findRawTicket(id);
    if (ticket.status === TicketStatus.CLOSED) throw new BadRequestException('Closed tickets cannot change status');
    if (ticket.status === TicketStatus.FINISHED && dto.status !== TicketStatus.FINISHED && dto.status !== TicketStatus.CLOSED) throw new BadRequestException('Finished tickets must be closed or reopened');
    if (dto.status === TicketStatus.CLOSED && ticket.status !== TicketStatus.FINISHED) throw new BadRequestException('Tickets must be finished before closing');
    if (dto.status === TicketStatus.CLOSED && !managerRoles.includes(user.role as UserRole)) throw new ForbiddenException('Workers cannot close tickets');
    if (user.role === UserRole.WORKER && ticket.assignedToId !== user.sub) throw new ForbiddenException('Workers can only update assigned tickets');

    const data: Prisma.TicketUpdateInput = { status: dto.status };
    if (dto.status === TicketStatus.FINISHED) data.finishedAt = new Date();
    if (dto.status === TicketStatus.CLOSED) {
      const closedAt = new Date();
      Object.assign(data, {
        closedAt,
        finishedAt: ticket.finishedAt ?? closedAt,
        closedBy: { connect: { id: user.sub } },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({ where: { id }, data });
      await this.createHistoryEntry(tx, {
        ticketId: id,
        userId: user.sub,
        action: this.getStatusHistoryAction(dto.status),
        previousStatus: ticket.status,
        newStatus: dto.status,
        previousAssigneeId: ticket.assignedToId,
        newAssigneeId: updated.assignedToId,
        details: dto.observation ? { observation: dto.observation } : undefined
      });
      return updated;
    });
  }

  finishTicket(id: string, user: AuthenticatedUser) {
    return this.changeTicketStatus(id, { status: TicketStatus.FINISHED }, user);
  }

  closeTicket(id: string, user: AuthenticatedUser) {
    this.assertManager(user);
    return this.changeTicketStatus(id, { status: TicketStatus.CLOSED }, user);
  }

  async reopenTicket(id: string, dto: ReopenTicketDto, user: AuthenticatedUser) {
    this.assertManager(user);
    const ticket = await this.findRawTicket(id);
    if (ticket.status !== TicketStatus.FINISHED) throw new BadRequestException('Only finished tickets can be reopened');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS, finishedAt: null },
      });

      await this.createHistoryEntry(tx, {
        ticketId: id,
        userId: user.sub,
        action: TicketHistoryAction.REOPENED,
        previousStatus: ticket.status,
        newStatus: updated.status,
        previousAssigneeId: ticket.assignedToId,
        newAssigneeId: updated.assignedToId,
        details: { observation: dto.observation },
      });

      return updated;
    });
  }

  async getTicketHistory(id: string, user: AuthenticatedUser) {
    await this.findTicketById(id, user);
    return this.prisma.ticketHistory.findMany({
      where: { ticketId: id },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  private buildTicketWhere(filters: TicketFiltersDto): Prisma.TicketWhereInput {
    const andConditions: Prisma.TicketWhereInput[] = [];
    const trayStatusFilter = this.getTrayStatusFilter(filters.tray);
    const where: Prisma.TicketWhereInput = {
      deleted: false,
      status: trayStatusFilter ?? filters.status,
      priority: filters.priority,
      ticketTypeId: filters.ticketTypeId,
      assignedToId: filters.assignedToId,
      assignedTo: filters.assignedToRut ? { rut: { contains: this.formatRut(filters.assignedToRut), mode: 'insensitive' } } : undefined,
      inputChannel: filters.inputChannel,
      code: filters.code ? { contains: filters.code, mode: 'insensitive' } : undefined,
      createdAt: filters.fromDate || filters.toDate ? { gte: filters.fromDate ? new Date(filters.fromDate) : undefined, lte: filters.toDate ? new Date(filters.toDate) : undefined } : undefined
    };

    if (trayStatusFilter && filters.status) {
      andConditions.push({ status: trayStatusFilter }, { status: filters.status });
      delete where.status;
    }

    const search = filters.search?.trim();
    if (search) {
      const formattedRutSearch = this.formatRut(search);
      andConditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { ticketType: { name: { contains: search, mode: 'insensitive' } } },
          { assignedTo: { name: { contains: search, mode: 'insensitive' } } },
          { assignedTo: { email: { contains: search, mode: 'insensitive' } } },
          { assignedTo: { rut: { contains: formattedRutSearch, mode: 'insensitive' } } }
        ]
      });
    }

    if (filters.overdue) andConditions.push({ dueDate: { lt: new Date() }, status: { notIn: terminalStatuses } });
    if (filters.nearDue) {
      const limit = new Date();
      limit.setDate(limit.getDate() + NEAR_DUE_DAYS);
      andConditions.push({ dueDate: { gte: new Date(), lte: limit }, status: { notIn: terminalStatuses } });
    }
    if (andConditions.length) where.AND = andConditions;
    return where;
  }

  private getTrayStatusFilter(tray?: TicketFiltersDto['tray']): Prisma.EnumTicketStatusFilter | TicketStatus | undefined {
    if (!tray || tray === 'all') return undefined;
    if (tray === 'inbox') return TicketStatus.ENTERED;
    if (tray === 'active') return { in: [TicketStatus.DERIVED, TicketStatus.IN_PROGRESS, TicketStatus.PENDING_INFORMATION] };
    if (tray === 'review') return TicketStatus.FINISHED;
    if (tray === 'closed') return TicketStatus.CLOSED;
    return undefined;
  }

  private formatRut(rut: string) {
    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length < 2) return cleanRut;

    const body = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${verifier}`;
  }

  private buildTicketOrderBy(filters: TicketFiltersDto): Prisma.TicketOrderByWithRelationInput[] {
    const dateOrder: Prisma.TicketOrderByWithRelationInput = filters.sortBy && filters.sortOrder ? { [filters.sortBy]: filters.sortOrder } : { createdAt: 'desc' };

    return [
      { closedAt: 'desc' },
      dateOrder,
      { createdAt: 'desc' },
    ];
  }

  private async findEditableTicket(id: string, user: AuthenticatedUser) {
    const ticket = await this.findRawTicket(id);
    this.assertTicketIsNotClosed(ticket);
    if (user.role === UserRole.WORKER && ticket.assignedToId !== user.sub) throw new ForbiddenException('Workers can only edit assigned tickets');
    return ticket;
  }

  private async findRawTicket(id: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, deleted: false } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private assertManager(user: AuthenticatedUser) {
    if (!managerRoles.includes(user.role as UserRole)) throw new ForbiddenException('Manager permissions are required');
  }

  private assertTicketIsNotClosed(ticket: Pick<Ticket, 'status'>) {
    if (ticket.status === TicketStatus.CLOSED) throw new BadRequestException('Closed tickets cannot be modified');
  }

  private ticketInclude() {
    return { ticketType: true, assignedTo: { select: { id: true, name: true, role: true } }, createdBy: { select: { id: true, name: true, role: true } } };
  }

  private ticketListSelect() {
    return {
      id: true,
      correlative: true,
      code: true,
      title: true,
      status: true,
      priority: true,
      inputChannel: true,
      ticketTypeId: true,
      assignedToId: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      enabled: true,
      deleted: true,
      ticketType: { select: { id: true, name: true, slaDays: true, active: true, createdAt: true, updatedAt: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } }
    } satisfies Prisma.TicketSelect;
  }

  private async ensureTicketTypeIsActive(ticketTypeId: string) {
    const ticketType = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticketType?.active) throw new BadRequestException('Ticket type is required and must be active');
  }

  private getStatusHistoryAction(status: TicketStatus) {
    if (status === TicketStatus.FINISHED) return TicketHistoryAction.FINISHED;
    if (status === TicketStatus.CLOSED) return TicketHistoryAction.CLOSED;
    return TicketHistoryAction.STATUS_CHANGED;
  }

  private createHistoryEntry(
    tx: Prisma.TransactionClient,
    data: {
      ticketId: string;
      userId: string;
      action: TicketHistoryAction;
      previousStatus?: TicketStatus;
      newStatus?: TicketStatus;
      previousAssigneeId?: string;
      newAssigneeId?: string;
      details?: Prisma.InputJsonValue;
    }
  ) {
    return tx.ticketHistory.create({ data });
  }

  private toJsonObject(value: Record<string, unknown>) {
    return value as Prisma.InputJsonObject;
  }
}
