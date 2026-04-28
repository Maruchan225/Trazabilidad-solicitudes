export type UserRole = 'MANAGER' | 'SUBSTITUTE' | 'WORKER';
export type TicketStatus = 'ENTERED' | 'DERIVED' | 'IN_PROGRESS' | 'PENDING_INFORMATION' | 'FINISHED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InputChannel = 'EMAIL' | 'IN_PERSON';

export type User = {
  id: string;
  name: string;
  rut?: string | null;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  accessToken: string;
  user: User;
};

export type TicketType = {
  id: string;
  name: string;
  description?: string | null;
  slaDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Ticket = {
  id: string;
  code?: string | null;
  correlative?: number | null;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  inputChannel: InputChannel;
  ticketTypeId: string;
  assignedToId: string;
  createdById: string;
  appliedSlaDays: number;
  dueDate: string;
  finishedAt?: string | null;
  closedAt?: string | null;
  enabled: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  ticketType?: TicketType;
  assignedTo?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  createdBy?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
};

export type TicketHistory = {
  id: string;
  action: string;
  previousStatus?: TicketStatus | null;
  newStatus?: TicketStatus | null;
  previousAssigneeId?: string | null;
  newAssigneeId?: string | null;
  details?: unknown;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'role'>;
};

export type TicketComment = {
  id: string;
  content: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'role'>;
};

export type TicketAttachment = {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageType: 'LOCAL' | 'GOOGLE_DRIVE';
  path: string;
  url?: string | null;
  deleted: boolean;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'role'>;
};

export type DashboardData = {
  totalTickets?: number;
  assignedTickets?: number;
  enteredTickets: number;
  derivedTickets: number;
  inProgressTickets: number;
  pendingInformationTickets: number;
  finishedTickets: number;
  closedTickets: number;
  overdueTickets: number;
  nearDueTickets: number;
};

export type ReportCount = {
  status?: TicketStatus;
  priority?: Priority;
  count: number;
  assignedToId?: string;
  ticketTypeId?: string;
  worker?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  ticketType?: Pick<TicketType, 'id' | 'name'> | null;
};

export type TypeStatusReport = {
  ticketTypeId: string;
  ticketType: Pick<TicketType, 'id' | 'name'>;
  counts: Record<TicketStatus, number>;
};

export type CreateTicketPayload = {
  code?: string;
  title: string;
  description: string;
  priority: Priority;
  inputChannel: InputChannel;
  ticketTypeId: string;
  assignedToId: string;
};

export type TicketFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  tray?: 'inbox' | 'active' | 'review' | 'closed' | 'all';
  status?: TicketStatus;
  priority?: Priority;
  ticketTypeId?: string;
  assignedToId?: string;
  assignedToRut?: string;
  inputChannel?: InputChannel;
  sortBy?: 'createdAt' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  overdue?: boolean;
  nearDue?: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateUserPayload = {
  name: string;
  rut: string;
  email: string;
  password: string;
  role: UserRole;
  enabled?: boolean;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>> & {
  password?: string;
};

export type CreateTicketTypePayload = {
  name: string;
  description?: string;
  slaDays: number;
};

export const roleLabels: Record<UserRole, string> = {
  MANAGER: 'Encargado',
  SUBSTITUTE: 'Suplente',
  WORKER: 'Trabajador',
};

export const statusLabels: Record<TicketStatus, string> = {
  ENTERED: 'Ingresada',
  DERIVED: 'Derivada',
  IN_PROGRESS: 'En proceso',
  PENDING_INFORMATION: 'Pendiente de informacion',
  FINISHED: 'Finalizada',
  CLOSED: 'Cerrada',
};

export const priorityLabels: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const inputChannelLabels: Record<InputChannel, string> = {
  EMAIL: 'Correo',
  IN_PERSON: 'Presencial',
};

export function isManagementRole(role?: UserRole) {
  return role === 'MANAGER' || role === 'SUBSTITUTE';
}
