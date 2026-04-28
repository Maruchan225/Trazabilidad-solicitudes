import { Button, Card, Form, Input, Modal, Select, Space, Table } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ModulePage } from '../components/ModulePage';
import { PriorityTag, StatusTag } from '../components/StatusTags';
import { ticketTypesService, ticketsService, usersService } from '../services/api';
import type { InputChannel, Priority, Ticket, TicketFilters, TicketStatus, TicketType, User } from '../types/domain';
import { inputChannelLabels, isManagementRole, priorityLabels, statusLabels } from '../types/domain';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../auth/useAuth';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

const searchDelayMs = 300;

function readFilters(searchParams: URLSearchParams): TicketFilters {
  return {
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as TicketStatus | null) || undefined,
    priority: (searchParams.get('priority') as Priority | null) || undefined,
    inputChannel: (searchParams.get('inputChannel') as InputChannel | null) || undefined,
  };
}

function buildFilterParams(filters: TicketFilters) {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false) searchParams.set(key, String(value));
  });
  return searchParams;
}

export function TicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = readFilters(searchParams);
  const { session } = useAuth();
  const currentUser = session?.user;
  const canManage = isManagementRole(currentUser?.role);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize')) || 8);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(initialFilters.search ?? '');
  const [appliedSearch, setAppliedSearch] = useState(initialFilters.search ?? '');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(initialFilters.status);
  const [priorityFilter, setPriorityFilter] = useState<Priority | undefined>(initialFilters.priority);
  const [inputChannelFilter, setInputChannelFilter] = useState<InputChannel | undefined>(initialFilters.inputChannel);
  const [form] = Form.useForm();

  const activeTicketTypes = useMemo(() => ticketTypes.filter((ticketType) => ticketType.active), [ticketTypes]);
  const workers = useMemo(() => users.filter((user) => user.enabled && user.role === 'WORKER'), [users]);
  const filters = useMemo<TicketFilters>(
    () => ({
      search: appliedSearch || undefined,
      page,
      pageSize,
      status: statusFilter,
      priority: priorityFilter,
      inputChannel: inputChannelFilter,
    }),
    [appliedSearch, page, pageSize, statusFilter, priorityFilter, inputChannelFilter],
  );

  async function loadBaseData() {
    setLoading(true);
    try {
      const ticketResult = await ticketsService.listTickets(filters);
      setTickets(ticketResult.items);
      setTotalTickets(ticketResult.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBaseData();
  }, [canManage, filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAppliedSearch(searchText.trim()), searchDelayMs);
    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  useEffect(() => {
    const nextParams = buildFilterParams(filters);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  function clearFilters() {
    setSearchText('');
    setAppliedSearch('');
    setPage(1);
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setInputChannelFilter(undefined);
  }

  async function openCreateTicketModal() {
    setTicketModalOpen(true);
    const promises: Promise<unknown>[] = [];
    if (!ticketTypes.length) promises.push(ticketTypesService.listTicketTypes().then(setTicketTypes));
    if (canManage && !users.length) promises.push(usersService.listUsers().then(setUsers));
    await Promise.all(promises);
  }

  async function createTicket(values: {
    code?: string;
    title: string;
    description: string;
    priority: Priority;
    inputChannel: InputChannel;
    ticketTypeId: string;
    assignedToId: string;
  }) {
    await ticketsService.createTicket(values);
    setTicketModalOpen(false);
    form.resetFields();
    await loadBaseData();
  }

  const columns: Columns<Ticket> = [
    { title: 'Correlativo', render: (_, ticket) => ticket.code ?? ticket.correlative ?? '-' },
    { title: 'Titulo', dataIndex: 'title' },
    { title: 'Estado', dataIndex: 'status', render: (status: TicketStatus) => <StatusTag status={status} /> },
    { title: 'Prioridad', dataIndex: 'priority', render: (priority: Priority) => <PriorityTag priority={priority} /> },
    { title: 'Tipo', render: (_, ticket) => ticket.ticketType?.name ?? '-' },
    { title: 'Responsable', render: (_, ticket) => ticket.assignedTo?.name ?? '-' },
    { title: 'Fecha de creacion', dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
    { title: 'Vencimiento', dataIndex: 'dueDate', render: (value: string) => formatDate(value) },
  ];

  function openTicketDetail(ticket: Ticket) {
    navigate(`/tickets/${ticket.id}`, { state: { returnTo: `${location.pathname}${location.search}` } });
  }

  return (
    <>
      <ModulePage
        title="Solicitudes"
        description={canManage ? 'Seguimiento global de solicitudes DOM.' : 'Solicitudes asignadas a su usuario.'}
        summaryCards={[
          { title: 'Total', value: totalTickets },
          { title: 'En pagina', value: tickets.length },
          { title: 'Finalizadas pagina', value: tickets.filter((ticket) => ticket.status === 'FINISHED').length },
          { title: 'Cerradas pagina', value: tickets.filter((ticket) => ticket.status === 'CLOSED').length },
        ]}
        actions={canManage ? <Button type="primary" icon={<Icon name="add" />} onClick={() => void openCreateTicketModal()}>Nueva solicitud</Button> : null}
      >
        <Card className="filter-card">
          <Space wrap>
            <Input.Search
              allowClear
              className="filter-search"
              placeholder="Buscar por correlativo, titulo, descripcion, tipo o responsable"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setPage(1);
              }}
              onSearch={(value) => {
                setAppliedSearch(value.trim());
                setPage(1);
              }}
            />
            <Select<TicketStatus>
              allowClear
              className="filter-control"
              placeholder="Filtrar estado"
              value={statusFilter}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />
            <Select<Priority>
              allowClear
              className="filter-control"
              placeholder="Filtrar prioridad"
              value={priorityFilter}
              options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setPriorityFilter(value);
                setPage(1);
              }}
            />
            <Select<InputChannel>
              allowClear
              className="filter-control"
              placeholder="Canal"
              value={inputChannelFilter}
              options={Object.entries(inputChannelLabels).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setInputChannelFilter(value);
                setPage(1);
              }}
            />
            <Button onClick={clearFilters}>Limpiar filtros</Button>
          </Space>
        </Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={tickets}
          rowClassName="clickable-row"
          onRow={(ticket) => ({
            onClick: () => openTicketDetail(ticket),
          })}
          pagination={{
            current: page,
            pageSize,
            total: totalTickets,
            showSizeChanger: true,
            pageSizeOptions: [8, 10, 20, 50],
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          locale={{ emptyText: 'No se encontraron solicitudes con los filtros aplicados.' }}
        />
      </ModulePage>
      <Modal title="Nueva solicitud" open={ticketModalOpen} onCancel={() => setTicketModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={createTicket} initialValues={{ priority: 'MEDIUM', inputChannel: 'EMAIL' }}>
          <Form.Item name="code" label="Correlativo">
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Titulo" rules={[{ required: true, message: 'Ingrese el titulo' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripcion" rules={[{ required: true, message: 'Ingrese la descripcion' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="Prioridad" rules={[{ required: true }]}>
            <Select options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="inputChannel" label="Canal de ingreso" rules={[{ required: true }]}>
            <Select options={Object.entries(inputChannelLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="ticketTypeId" label="Tipo de solicitud" rules={[{ required: true, message: 'Seleccione el tipo' }]}>
            <Select options={activeTicketTypes.map((ticketType) => ({ value: ticketType.id, label: ticketType.name }))} />
          </Form.Item>
          <Form.Item name="assignedToId" label="Responsable" rules={[{ required: true, message: 'Seleccione el responsable' }]}>
            <Select options={workers.map((user) => ({ value: user.id, label: user.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
