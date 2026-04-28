import type { DashboardData, ReportCount } from '../types/domain';
import { priorityLabels, statusLabels } from '../types/domain';

export const chartTrafficLightColors = ['#10b981', '#f59e0b', '#ef4444'];
export const chartNeutralColor = '#64748b';
export const chartBrandColor = '#b5540d';

const statusColors: Record<string, string> = {
  Ingresada: '#f59e0b',
  Derivada: '#2563eb',
  'En proceso': '#2563eb',
  'Pendiente informacion': '#2563eb',
  'Pend. info': '#2563eb',
  Finalizada: '#10b981',
  Cerrada: '#10b981',
  Vencidas: '#ef4444',
  Vencida: '#ef4444',
  'Por vencer': '#f59e0b',
};

const priorityColors: Record<string, string> = {
  Baja: '#10b981',
  Media: '#f59e0b',
  Alta: '#ef4444',
  Urgente: '#ef4444',
};

export function getDashboardStatusData(dashboard: DashboardData | null) {
  return [
    { label: 'Ingresadas', value: dashboard?.enteredTickets ?? 0, color: '#f59e0b' },
    { label: 'Derivadas', value: dashboard?.derivedTickets ?? 0, color: '#2563eb' },
    { label: 'En proceso', value: dashboard?.inProgressTickets ?? 0, color: '#2563eb' },
    { label: 'Pend. info', value: dashboard?.pendingInformationTickets ?? 0, color: '#2563eb' },
    { label: 'Finalizadas', value: dashboard?.finishedTickets ?? 0, color: '#10b981' },
    { label: 'Cerradas', value: dashboard?.closedTickets ?? 0, color: '#10b981' },
  ];
}

export function getDashboardAlertData(dashboard: DashboardData | null) {
  return [
    { label: 'Vencidas', value: dashboard?.overdueTickets ?? 0, color: '#ef4444' },
    { label: 'Por vencer', value: dashboard?.nearDueTickets ?? 0, color: '#f59e0b' },
    { label: 'Finalizadas', value: dashboard?.finishedTickets ?? 0, color: '#10b981' },
  ];
}

export function mapStatusReport(rows: ReportCount[]) {
  return rows.map((row) => {
    const label = row.status ? statusLabels[row.status] : '-';
    return {
    label,
    value: row.count,
    color: statusColors[label] ?? chartNeutralColor,
  };
  });
}

export function mapPriorityReport(rows: ReportCount[]) {
  return rows.map((row) => {
    const label = row.priority ? priorityLabels[row.priority] : '-';
    return {
    label,
    value: row.count,
    color: priorityColors[label] ?? chartNeutralColor,
  };
  });
}

export function mapTypeReport(rows: ReportCount[]) {
  return rows.map((row, index) => ({
    label: row.ticketType?.name ?? row.ticketTypeId ?? '-',
    value: row.count,
    color: chartTrafficLightColors[index % chartTrafficLightColors.length],
  }));
}

export function mapWorkloadReport(rows: ReportCount[]) {
  return rows.map((row, index) => ({
    label: row.worker?.name ?? row.assignedToId ?? '-',
    value: row.count,
    color: chartTrafficLightColors[index % chartTrafficLightColors.length],
  }));
}
