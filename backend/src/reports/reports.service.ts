import { Injectable } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { NEAR_DUE_DAYS } from '../common/constants/sla.constants';
import { PrismaService } from '../prisma/prisma.service';
import { ReportFiltersDto } from './dto/report-filters.dto';

const terminalStatuses: TicketStatus[] = [TicketStatus.FINISHED, TicketStatus.CLOSED];
const ticketStatuses: TicketStatus[] = [
  TicketStatus.ENTERED,
  TicketStatus.DERIVED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING_INFORMATION,
  TicketStatus.FINISHED,
  TicketStatus.CLOSED
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  getOverdueTickets(filters: ReportFiltersDto) {
    return this.prisma.ticket.findMany({
      where: {
        AND: [this.buildBaseWhere(filters), { dueDate: { lt: new Date() }, status: { notIn: terminalStatuses } }]
      },
      include: this.ticketInclude(),
      orderBy: { dueDate: 'asc' }
    });
  }

  getNearDueTickets(filters: ReportFiltersDto) {
    const now = new Date();
    const nearDueLimit = new Date(now);
    nearDueLimit.setDate(nearDueLimit.getDate() + NEAR_DUE_DAYS);

    return this.prisma.ticket.findMany({
      where: {
        AND: [this.buildBaseWhere(filters), { dueDate: { gte: now, lte: nearDueLimit }, status: { notIn: terminalStatuses } }]
      },
      include: this.ticketInclude(),
      orderBy: { dueDate: 'asc' }
    });
  }

  async getAverageResponseTime(filters: ReportFiltersDto) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        AND: [this.buildBaseWhere(filters), { OR: [{ finishedAt: { not: null } }, { closedAt: { not: null } }] }]
      },
      select: {
        id: true,
        createdAt: true,
        finishedAt: true,
        closedAt: true
      }
    });

    const totalMilliseconds = tickets.reduce((sum, ticket) => {
      const responseDate = ticket.finishedAt ?? ticket.closedAt;
      if (!responseDate) return sum;
      return sum + (responseDate.getTime() - ticket.createdAt.getTime());
    }, 0);

    const averageMilliseconds = tickets.length ? totalMilliseconds / tickets.length : 0;
    const averageHours = averageMilliseconds / 36e5;

    return {
      totalTickets: tickets.length,
      averageMilliseconds,
      averageHours,
      averageDays: averageHours / 24
    };
  }

  async getWorkloadByWorker(filters: ReportFiltersDto) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: this.buildBaseWhere(filters),
      _count: { _all: true },
      orderBy: { assignedToId: 'asc' }
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((row) => row.assignedToId) } },
      select: { id: true, name: true, email: true, role: true }
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return rows.map((row) => ({
      worker: usersById.get(row.assignedToId) ?? null,
      assignedToId: row.assignedToId,
      count: row._count._all
    }));
  }

  async getTicketsByStatus(filters: ReportFiltersDto) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: this.buildBaseWhere(filters),
      _count: { _all: true },
      orderBy: { status: 'asc' }
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all
    }));
  }

  async getTicketsByType(filters: ReportFiltersDto) {
    const [rows, ticketTypes] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['ticketTypeId'],
        where: this.buildBaseWhere(filters),
        _count: { _all: true },
        orderBy: { ticketTypeId: 'asc' }
      }),
      this.prisma.ticketType.findMany({
        where: filters.ticketTypeId ? { id: filters.ticketTypeId } : undefined,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ]);

    const countsByTicketTypeId = new Map(rows.map((row) => [row.ticketTypeId, row._count._all]));

    return ticketTypes.map((ticketType) => ({
      ticketType,
      ticketTypeId: ticketType.id,
      count: countsByTicketTypeId.get(ticketType.id) ?? 0
    }));
  }

  async getTicketsByTypeAndStatus(filters: ReportFiltersDto) {
    const [rows, ticketTypes] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['ticketTypeId', 'status'],
        where: this.buildBaseWhere(filters),
        _count: { _all: true },
        orderBy: [{ ticketTypeId: 'asc' }, { status: 'asc' }]
      }),
      this.prisma.ticketType.findMany({
        where: filters.ticketTypeId ? { id: filters.ticketTypeId } : undefined,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ]);

    const countsByTypeAndStatus = new Map(rows.map((row) => [`${row.ticketTypeId}:${row.status}`, row._count._all]));

    return ticketTypes.map((ticketType) => ({
      ticketType,
      ticketTypeId: ticketType.id,
      counts: Object.fromEntries(
        ticketStatuses.map((status) => [status, countsByTypeAndStatus.get(`${ticketType.id}:${status}`) ?? 0])
      )
    }));
  }

  async getTicketsByPriority(filters: ReportFiltersDto) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where: this.buildBaseWhere(filters),
      _count: { _all: true },
      orderBy: { priority: 'asc' }
    });

    return rows.map((row) => ({
      priority: row.priority,
      count: row._count._all
    }));
  }

  getFinishedTickets(filters: ReportFiltersDto) {
    return this.prisma.ticket.findMany({
      where: {
        AND: [this.buildBaseWhere(filters), { status: TicketStatus.FINISHED }]
      },
      include: this.ticketInclude(),
      orderBy: { finishedAt: 'desc' }
    });
  }

  getClosedTickets(filters: ReportFiltersDto) {
    return this.prisma.ticket.findMany({
      where: {
        AND: [this.buildBaseWhere(filters), { status: TicketStatus.CLOSED }]
      },
      include: this.ticketInclude(),
      orderBy: { closedAt: 'desc' }
    });
  }

  buildDateFilter(fromDate?: string, toDate?: string): Prisma.DateTimeFilter | undefined {
    if (!fromDate && !toDate) return undefined;

    return {
      gte: fromDate ? new Date(fromDate) : undefined,
      lte: toDate ? new Date(toDate) : undefined
    };
  }

  private buildBaseWhere(filters: ReportFiltersDto): Prisma.TicketWhereInput {
    return {
      deleted: false,
      createdAt: this.buildDateFilter(filters.fromDate, filters.toDate),
      assignedToId: filters.workerId,
      ticketTypeId: filters.ticketTypeId,
      priority: filters.priority,
      status: filters.status
    };
  }

  private ticketInclude() {
    return {
      ticketType: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      closedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    } satisfies Prisma.TicketInclude;
  }
}
