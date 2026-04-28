import type { DashboardData, ReportCount, TicketStatus, TypeStatusReport } from '../types/domain';
import { priorityLabels, statusLabels } from '../types/domain';
import { dueStatusColors, priorityColors, statusColors as ticketStatusColors } from './colors';

export const chartTrafficLightColors = [dueStatusColors.onTime, dueStatusColors.nearDue, dueStatusColors.overdue];
export const chartNeutralColor = '#64748b';
export const chartBrandColor = '#60a5fa';

const statusChartColors: Record<string, string> = {
  Ingresada: ticketStatusColors.ENTERED,
  Derivada: ticketStatusColors.DERIVED,
  'En proceso': ticketStatusColors.IN_PROGRESS,
  'Pendiente informacion': ticketStatusColors.PENDING_INFORMATION,
  'Pend. info': ticketStatusColors.PENDING_INFORMATION,
  Finalizada: ticketStatusColors.FINISHED,
  Cerrada: ticketStatusColors.CLOSED,
  Vencidas: dueStatusColors.overdue,
  Vencida: dueStatusColors.overdue,
  'Por vencer': dueStatusColors.nearDue,
};

const priorityChartColors: Record<string, string> = {
  Baja: priorityColors.LOW,
  Media: priorityColors.MEDIUM,
  Alta: priorityColors.HIGH,
  Urgente: priorityColors.URGENT,
};

export function getDashboardStatusData(dashboard: DashboardData | null) {
  return [
    { label: 'Ingresadas', value: dashboard?.enteredTickets ?? 0, color: ticketStatusColors.ENTERED },
    { label: 'Derivadas', value: dashboard?.derivedTickets ?? 0, color: ticketStatusColors.DERIVED },
    { label: 'En proceso', value: dashboard?.inProgressTickets ?? 0, color: ticketStatusColors.IN_PROGRESS },
    { label: 'Pend. info', value: dashboard?.pendingInformationTickets ?? 0, color: ticketStatusColors.PENDING_INFORMATION },
    { label: 'Finalizadas', value: dashboard?.finishedTickets ?? 0, color: ticketStatusColors.FINISHED },
    { label: 'Cerradas', value: dashboard?.closedTickets ?? 0, color: ticketStatusColors.CLOSED },
  ];
}

export function getDashboardAlertData(dashboard: DashboardData | null) {
  const activeTickets =
    (dashboard?.enteredTickets ?? 0) +
    (dashboard?.derivedTickets ?? 0) +
    (dashboard?.inProgressTickets ?? 0) +
    (dashboard?.pendingInformationTickets ?? 0);
  const overdueTickets = dashboard?.overdueTickets ?? 0;
  const nearDueTickets = dashboard?.nearDueTickets ?? 0;
  const onTimeTickets = Math.max(0, activeTickets - overdueTickets - nearDueTickets);

  return [
    { label: 'Vencidas', value: overdueTickets, color: dueStatusColors.overdue },
    { label: 'Por vencer', value: nearDueTickets, color: dueStatusColors.nearDue },
    { label: 'Dentro de plazo', value: onTimeTickets, color: dueStatusColors.onTime },
  ];
}

export function mapStatusReport(rows: ReportCount[]) {
  return rows.map((row) => {
    const label = row.status ? statusLabels[row.status] : '-';
    return {
    label,
    value: row.count,
    color: statusChartColors[label] ?? chartNeutralColor,
  };
  });
}

export function mapPriorityReport(rows: ReportCount[]) {
  return rows.map((row) => {
    const label = row.priority ? priorityLabels[row.priority] : '-';
    return {
    label,
    value: row.count,
    color: priorityChartColors[label] ?? chartNeutralColor,
  };
  });
}

export function mapTypeReport(rows: ReportCount[]) {
  return rows.map((row) => ({
    label: row.ticketType?.name ?? row.ticketTypeId ?? '-',
    value: row.count,
    color: chartBrandColor,
  }));
}

export function mapWorkloadReport(rows: ReportCount[]) {
  return rows.map((row) => ({
    label: row.worker?.name ?? row.assignedToId ?? '-',
    value: row.count,
    color: chartBrandColor,
  }));
}

export const typeStatusStackKeys: Array<{ key: TicketStatus; label: string; color: string }> = [
  { key: 'ENTERED', label: statusLabels.ENTERED, color: ticketStatusColors.ENTERED },
  { key: 'DERIVED', label: statusLabels.DERIVED, color: ticketStatusColors.DERIVED },
  { key: 'IN_PROGRESS', label: statusLabels.IN_PROGRESS, color: ticketStatusColors.IN_PROGRESS },
  { key: 'PENDING_INFORMATION', label: 'Pend. informacion', color: ticketStatusColors.PENDING_INFORMATION },
  { key: 'FINISHED', label: statusLabels.FINISHED, color: ticketStatusColors.FINISHED },
  { key: 'CLOSED', label: statusLabels.CLOSED, color: ticketStatusColors.CLOSED },
];

export function mapTypeStatusReport(rows: TypeStatusReport[]) {
  return rows.map((row) => ({
    label: row.ticketType.name,
    ...row.counts,
  }));
}
