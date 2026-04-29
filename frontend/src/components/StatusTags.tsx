import { Tag } from 'antd';
import type { Priority, TicketStatus, UserRole } from '../types/domain';
import { priorityLabels, roleLabels, statusLabels } from '../types/domain';
import { priorityColors, statusColors, statusGroupLabels } from '../utils/colors';

export function StatusTag({ status }: { status: TicketStatus }) {
  return (
    <Tag color={statusColors[status]} title={statusGroupLabels[status]}>
      {statusLabels[status]}
    </Tag>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  return <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>;
}

export function RoleTag({ role }: { role?: UserRole }) {
  if (!role) return <Tag>Sin rol</Tag>;
  const color = role === 'MANAGER' ? 'blue' : role === 'SUBSTITUTE' ? 'purple' : role === 'SECRETARY' ? 'gold' : 'cyan';
  return <Tag color={color}>{roleLabels[role]}</Tag>;
}
