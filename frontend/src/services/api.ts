import type {
  AuthSession,
  CreateTicketPayload,
  CreateTicketTypePayload,
  CreateUserPayload,
  DashboardData,
  PaginatedResult,
  ReportCount,
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketFilters,
  TicketHistory,
  TicketStatus,
  TicketType,
  TypeStatusReport,
  UpdateUserPayload,
  User,
} from '../types/domain';
import { request } from './http';

export const authService = {
  login: (payload: { email: string; password: string }) =>
    request<AuthSession>('/auth/login', { method: 'POST', body: payload, token: null }),
  getCurrentUser: () => request<User>('/auth/me'),
};

export const dashboardService = {
  getDashboard: () => request<DashboardData>('/dashboard'),
};

export const ticketsService = {
  listTickets: (filters: TicketFilters = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) searchParams.set(key, String(value));
    });
    const query = searchParams.toString();
    return request<PaginatedResult<Ticket>>(`/tickets${query ? `?${query}` : ''}`);
  },
  getTicket: (id: string) => request<Ticket>(`/tickets/${id}`),
  createTicket: (payload: CreateTicketPayload) => request<Ticket>('/tickets', { method: 'POST', body: payload }),
  changeStatus: (id: string, status: TicketStatus, observation?: string) =>
    request<Ticket>(`/tickets/${id}/status`, { method: 'PATCH', body: { status, observation } }),
  finishTicket: (id: string) => request<Ticket>(`/tickets/${id}/finish`, { method: 'PATCH' }),
  closeTicket: (id: string) => request<Ticket>(`/tickets/${id}/close`, { method: 'PATCH' }),
  reopenTicket: (id: string, observation: string) =>
    request<Ticket>(`/tickets/${id}/reopen`, { method: 'PATCH', body: { observation } }),
  getHistory: (id: string) => request<TicketHistory[]>(`/tickets/${id}/history`),
};

export const ticketTypesService = {
  listTicketTypes: () => request<TicketType[]>('/ticket-types'),
  createTicketType: (payload: CreateTicketTypePayload) => request<TicketType>('/ticket-types', { method: 'POST', body: payload }),
  updateTicketType: (id: string, payload: Partial<CreateTicketTypePayload>) =>
    request<TicketType>(`/ticket-types/${id}`, { method: 'PATCH', body: payload }),
  enableTicketType: (id: string) => request<TicketType>(`/ticket-types/${id}/enable`, { method: 'PATCH' }),
  disableTicketType: (id: string) => request<TicketType>(`/ticket-types/${id}/disable`, { method: 'PATCH' }),
};

export const usersService = {
  listUsers: () => request<User[]>('/users'),
  createUser: (payload: CreateUserPayload) => request<User>('/users', { method: 'POST', body: payload }),
  updateUser: (id: string, payload: UpdateUserPayload) => request<User>(`/users/${id}`, { method: 'PATCH', body: payload }),
};

export const commentsService = {
  listComments: (ticketId: string) => request<TicketComment[]>(`/tickets/${ticketId}/comments`),
  createComment: (ticketId: string, content: string) =>
    request<TicketComment>(`/tickets/${ticketId}/comments`, { method: 'POST', body: { content } }),
};

export const attachmentsService = {
  listAttachments: (ticketId: string) => request<TicketAttachment[]>(`/tickets/${ticketId}/attachments`),
  uploadAttachment: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<TicketAttachment>(`/tickets/${ticketId}/attachments`, { method: 'POST', body: formData });
  },
};

export const reportsService = {
  getTicketsByStatus: () => request<ReportCount[]>('/reports/tickets-by-status'),
  getTicketsByPriority: () => request<ReportCount[]>('/reports/tickets-by-priority'),
  getTicketsByType: () => request<ReportCount[]>('/reports/tickets-by-type'),
  getTicketsByTypeAndStatus: () => request<TypeStatusReport[]>('/reports/tickets-by-type-and-status'),
  getWorkloadByWorker: () => request<ReportCount[]>('/reports/workload-by-worker'),
};
