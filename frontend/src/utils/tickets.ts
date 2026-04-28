import type { Ticket, TicketStatus } from '../types/domain';

export type TicketDueStatus = 'OVERDUE' | 'NEAR_DUE' | 'ON_TIME' | 'FINISHED';

const nearDueDays = 3;
const terminalStatuses: TicketStatus[] = ['FINISHED', 'CLOSED'];

export function isTicketOverdue(ticket: Pick<Ticket, 'dueDate' | 'status'>) {
  return getTicketDueStatus(ticket) === 'OVERDUE';
}

export function getTicketDueStatus(ticket: Pick<Ticket, 'dueDate' | 'status'>): TicketDueStatus {
  if (terminalStatuses.includes(ticket.status)) return 'FINISHED';

  const now = new Date();
  const dueDate = new Date(ticket.dueDate);
  const millisecondsUntilDue = dueDate.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(millisecondsUntilDue / 86_400_000);

  if (millisecondsUntilDue < 0) return 'OVERDUE';
  if (daysUntilDue <= nearDueDays) return 'NEAR_DUE';
  return 'ON_TIME';
}
