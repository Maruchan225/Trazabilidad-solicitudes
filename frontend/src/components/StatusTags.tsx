import { Tag } from 'antd';
import type { Priority, TicketStatus, UserRole } from '../types/domain';
import { priorityLabels, roleLabels, statusLabels } from '../types/domain';

const statusGroupColors: Record<TicketStatus, string> = {
  ENTERED: '#f59e0b',
  DERIVED: '#2563eb',
  IN_PROGRESS: '#2563eb',
  PENDING_INFORMATION: '#2563eb',
  FINISHED: '#10b981',
  CLOSED: '#10b981',
};

const statusGroupLabels: Record<TicketStatus, string> = {
  ENTERED: 'Nueva',
  DERIVED: 'En proceso',
  IN_PROGRESS: 'En proceso',
  PENDING_INFORMATION: 'En proceso',
  FINISHED: 'Finalizado',
  CLOSED: 'Finalizado',
};

export function StatusTag({ status }: { status: TicketStatus }) {
  return (
    <Tag color={statusGroupColors[status]} title={statusGroupLabels[status]}>
      {statusLabels[status]}
    </Tag>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  const color = priority === 'URGENT' ? 'red' : priority === 'HIGH' ? 'orange' : priority === 'MEDIUM' ? 'gold' : 'green';
  return <Tag color={color}>{priorityLabels[priority]}</Tag>;
}

export function RoleTag({ role }: { role?: UserRole }) {
  if (!role) return <Tag>Sin rol</Tag>;
  const color = role === 'MANAGER' ? 'blue' : role === 'SUBSTITUTE' ? 'purple' : 'cyan';
  return <Tag color={color}>{roleLabels[role]}</Tag>;
}
