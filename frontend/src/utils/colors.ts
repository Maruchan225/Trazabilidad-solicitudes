import type { Priority, TicketStatus } from '../types/domain';

export const statusColors: Record<TicketStatus, string> = {
  ENTERED: '#64748b',
  DERIVED: '#2563eb',
  IN_PROGRESS: '#7c3aed',
  PENDING_INFORMATION: '#f59e0b',
  FINISHED: '#14b8a6',
  CLOSED: '#10b981',
};

export const statusGroupLabels: Record<TicketStatus, string> = {
  ENTERED: 'Nueva',
  DERIVED: 'En trabajo',
  IN_PROGRESS: 'En trabajo',
  PENDING_INFORMATION: 'Requiere atencion',
  FINISHED: 'Finalizada para revision',
  CLOSED: 'Cerrada',
};

export const priorityColors: Record<Priority, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export const dueStatusColors = {
  onTime: '#10b981',
  nearDue: '#f59e0b',
  overdue: '#ef4444',
};
