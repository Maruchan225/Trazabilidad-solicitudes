import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, TicketStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const managerRoles: UserRole[] = [UserRole.MANAGER, UserRole.SUBSTITUTE];
const nearDueDays = 2;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getDashboard(user: AuthenticatedUser) {
    if (this.isManager(user)) return this.getManagerDashboard(user);
    return this.getWorkerDashboard(user);
  }

  async getManagerDashboard(user: AuthenticatedUser) {
    this.assertManager(user);
    const where = this.baseTicketWhere();

    const [
      totalTickets,
      enteredTickets,
      derivedTickets,
      inProgressTickets,
      pendingInformationTickets,
      finishedTickets,
      closedTickets,
      overdueTickets,
      nearDueTickets,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByType,
      workloadByWorker
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.countByStatus(TicketStatus.ENTERED, where),
      this.countByStatus(TicketStatus.DERIVED, where),
      this.countByStatus(TicketStatus.IN_PROGRESS, where),
      this.countByStatus(TicketStatus.PENDING_INFORMATION, where),
      this.countByStatus(TicketStatus.FINISHED, where),
      this.countByStatus(TicketStatus.CLOSED, where),
      this.getOverdueCount(where),
      this.getNearDueCount(where),
      this.getTicketsByStatus(where),
      this.getTicketsByPriority(where),
      this.getTicketsByType(where),
      this.getWorkloadByWorker(where)
    ]);

    return {
      totalTickets,
      enteredTickets,
      derivedTickets,
      inProgressTickets,
      pendingInformationTickets,
      finishedTickets,
      closedTickets,
      overdueTickets,
      nearDueTickets,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByType,
      workloadByWorker
    };
  }

  async getWorkerDashboard(user: AuthenticatedUser) {
    const where = this.baseTicketWhere({ assignedToId: user.sub });

    const [assignedTickets, enteredTickets, derivedTickets, inProgressTickets, pendingInformationTickets, finishedTickets, closedTickets, overdueTickets, nearDueTickets] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.countByStatus(TicketStatus.ENTERED, where),
      this.countByStatus(TicketStatus.DERIVED, where),
      this.countByStatus(TicketStatus.IN_PROGRESS, where),
      this.countByStatus(TicketStatus.PENDING_INFORMATION, where),
      this.countByStatus(TicketStatus.FINISHED, where),
      this.countByStatus(TicketStatus.CLOSED, where),
      this.getOverdueCount(where),
      this.getNearDueCount(where)
    ]);

    return {
      assignedTickets,
      enteredTickets,
      derivedTickets,
      inProgressTickets,
      pendingInformationTickets,
      finishedTickets,
      closedTickets,
      overdueTickets,
      nearDueTickets
    };
  }

  async getTicketsByStatus(where: Prisma.TicketWhereInput = this.baseTicketWhere()) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      orderBy: { status: 'asc' }
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all
    }));
  }

  async getTicketsByPriority(where: Prisma.TicketWhereInput = this.baseTicketWhere()) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: { _all: true },
      orderBy: { priority: 'asc' }
    });

    return rows.map((row) => ({
      priority: row.priority,
      count: row._count._all
    }));
  }

  async getTicketsByType(where: Prisma.TicketWhereInput = this.baseTicketWhere()) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['ticketTypeId'],
      where,
      _count: { _all: true },
      orderBy: { ticketTypeId: 'asc' }
    });

    const ticketTypes = await this.prisma.ticketType.findMany({
      where: { id: { in: rows.map((row) => row.ticketTypeId) } },
      select: { id: true, name: true }
    });
    const namesById = new Map(ticketTypes.map((ticketType) => [ticketType.id, ticketType.name]));

    return rows.map((row) => ({
      ticketTypeId: row.ticketTypeId,
      ticketTypeName: namesById.get(row.ticketTypeId) ?? null,
      count: row._count._all
    }));
  }

  async getWorkloadByWorker(where: Prisma.TicketWhereInput = this.baseTicketWhere()) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['assignedToId'],
      where,
      _count: { _all: true },
      orderBy: { assignedToId: 'asc' }
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((row) => row.assignedToId) } },
      select: { id: true, name: true, email: true, role: true }
    });
    const usersById = new Map(users.map((worker) => [worker.id, worker]));

    return rows.map((row) => ({
      worker: usersById.get(row.assignedToId) ?? null,
      assignedToId: row.assignedToId,
      count: row._count._all
    }));
  }

  getOverdueCount(where: Prisma.TicketWhereInput = this.baseTicketWhere()) {
    return this.prisma.ticket.count({
      where: {
        AND: [where, { dueDate: { lt: new Date() }, status: { not: TicketStatus.CLOSED } }]
      }
    });
  }

  getNearDueCount(where: Prisma.TicketWhereInput = this.baseTicketWhere()) {
    const now = new Date();
    const nearDueLimit = new Date(now);
    nearDueLimit.setDate(nearDueLimit.getDate() + nearDueDays);

    return this.prisma.ticket.count({
      where: {
        AND: [where, { dueDate: { gte: now, lte: nearDueLimit }, status: { not: TicketStatus.CLOSED } }]
      }
    });
  }

  private countByStatus(status: TicketStatus, where: Prisma.TicketWhereInput) {
    return this.prisma.ticket.count({ where: { AND: [where, { status }] } });
  }

  private baseTicketWhere(extra?: Prisma.TicketWhereInput): Prisma.TicketWhereInput {
    return { deleted: false, ...extra };
  }

  private assertManager(user: AuthenticatedUser) {
    if (!this.isManager(user)) throw new ForbiddenException('Manager dashboard requires manager permissions');
  }

  private isManager(user: AuthenticatedUser) {
    return managerRoles.includes(user.role as UserRole);
  }
}
