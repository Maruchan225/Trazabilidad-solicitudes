import { Button, Card, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TablePaginationConfig, TableProps } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ModulePage } from '../components/ModulePage';
import { PriorityTag, StatusTag } from '../components/StatusTags';
import { ticketTypesService, ticketsService, usersService } from '../services/api';
import type { InputChannel, Priority, Ticket, TicketFilters, TicketStatus, TicketType, User } from '../types/domain';
import { inputChannelLabels, isManagementRole, priorityLabels, statusLabels } from '../types/domain';
import { dueStatusColors } from '../utils/colors';
import { formatDate } from '../utils/formatters';
import { getTicketDueStatus, isTicketOverdue } from '../utils/tickets';
import { useAuth } from '../auth/useAuth';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

const searchDelayMs = 300;
const overdueFilterValue = 'OVERDUE';
type TicketSortField = 'createdAt' | 'dueDate';
type TicketTray = NonNullable<TicketFilters['tray']>;

const trayOptions: { key: TicketTray; label: string }[] = [
  { key: 'inbox', label: 'Entrada' },
  { key: 'active', label: 'En gestion' },
  { key: 'review', label: 'En revision' },
  { key: 'closed', label: 'Cerradas' },
  { key: 'all', label: 'Todas' },
];

const emptyTextByTray: Record<TicketTray, string> = {
  inbox: 'No hay solicitudes nuevas.',
  active: 'No hay solicitudes en gestion.',
  review: 'No hay solicitudes pendientes de cierre.',
  closed: 'No hay solicitudes cerradas.',
  all: 'No hay solicitudes registradas.',
};

function renderDueDate(ticket: Ticket) {
  const dueStatus = getTicketDueStatus(ticket);
  if (dueStatus === 'OVERDUE') {
    return (
      <Space direction="vertical" size={0}>
        <Tag color={dueStatusColors.overdue}>Vencida</Tag>
        <Typography.Text type="secondary">Vencio el {formatDate(ticket.dueDate)}</Typography.Text>
      </Space>
    );
  }

  if (dueStatus === 'NEAR_DUE') {
    return (
      <Space direction="vertical" size={0}>
        <Tag color={dueStatusColors.nearDue}>Solicitud proxima a vencer</Tag>
        <Typography.Text type="secondary">Vence el {formatDate(ticket.dueDate)}</Typography.Text>
      </Space>
    );
  }

  return <Typography.Text>{formatDate(ticket.dueDate)}</Typography.Text>;
}

function readFilters(searchParams: URLSearchParams): TicketFilters {
  const tray = searchParams.get('tray') as TicketTray | null;

  return {
    search: searchParams.get('search') || undefined,
    tray: trayOptions.some((item) => item.key === tray) ? tray ?? undefined : 'inbox',
    status: (searchParams.get('status') as TicketStatus | null) || undefined,
    priority: (searchParams.get('priority') as Priority | null) || undefined,
    inputChannel: (searchParams.get('inputChannel') as InputChannel | null) || undefined,
    overdue: searchParams.get('overdue') === 'true' || undefined,
    sortBy: (searchParams.get('sortBy') as TicketSortField | null) || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc' | null) || undefined,
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
  const [trayCounts, setTrayCounts] = useState<Record<TicketTray, number>>({
    inbox: 0,
    active: 0,
    review: 0,
    closed: 0,
    all: 0,
  });
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize')) || 8);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(initialFilters.search ?? '');
  const [appliedSearch, setAppliedSearch] = useState(initialFilters.search ?? '');
  const [trayFilter, setTrayFilter] = useState<TicketTray>(initialFilters.tray ?? 'inbox');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(initialFilters.status);
  const [priorityFilter, setPriorityFilter] = useState<Priority | undefined>(initialFilters.priority);
  const [inputChannelFilter, setInputChannelFilter] = useState<InputChannel | undefined>(initialFilters.inputChannel);
  const [overdueFilter, setOverdueFilter] = useState<boolean | undefined>(initialFilters.overdue);
  const [sortBy, setSortBy] = useState<TicketSortField | undefined>(initialFilters.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(initialFilters.sortOrder);
  const [form] = Form.useForm();
  const canFilterByStatus = trayFilter === 'all';

  const activeTicketTypes = useMemo(() => ticketTypes.filter((ticketType) => ticketType.active), [ticketTypes]);
  const workers = useMemo(() => users.filter((user) => user.enabled && user.role === 'WORKER'), [users]);
  const hasActiveFilters = Boolean(appliedSearch || priorityFilter || inputChannelFilter || overdueFilter || (canFilterByStatus && statusFilter));
  const emptyText = hasActiveFilters ? 'No se encontraron solicitudes con los filtros aplicados.' : emptyTextByTray[trayFilter];
  const trayCountFilters = useMemo<TicketFilters>(
    () => ({
      search: appliedSearch || undefined,
      priority: priorityFilter,
      inputChannel: inputChannelFilter,
      overdue: overdueFilter,
    }),
    [appliedSearch, priorityFilter, inputChannelFilter, overdueFilter],
  );
  const filters = useMemo<TicketFilters>(
    () => ({
      search: appliedSearch || undefined,
      page,
      pageSize,
      tray: trayFilter,
      status: canFilterByStatus ? statusFilter : undefined,
      priority: priorityFilter,
      inputChannel: inputChannelFilter,
      overdue: overdueFilter,
      sortBy,
      sortOrder,
    }),
    [appliedSearch, page, pageSize, trayFilter, canFilterByStatus, statusFilter, priorityFilter, inputChannelFilter, overdueFilter, sortBy, sortOrder],
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

  async function loadTrayCounts() {
    const results = await Promise.all(
      trayOptions.map(async (tray) => {
        const result = await ticketsService.listTickets({ ...trayCountFilters, tray: tray.key, page: 1, pageSize: 1 });
        return [tray.key, result.total] as const;
      }),
    );
    setTrayCounts(Object.fromEntries(results) as Record<TicketTray, number>);
  }

  useEffect(() => {
    void loadBaseData();
  }, [canManage, filters]);

  useEffect(() => {
    void loadTrayCounts();
  }, [canManage, trayCountFilters]);

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
    setOverdueFilter(undefined);
    setSortBy(undefined);
    setSortOrder(undefined);
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
    await Promise.all([loadBaseData(), loadTrayCounts()]);
  }

  const columns: Columns<Ticket> = [
    { title: 'Correlativo', render: (_, ticket) => ticket.code ?? ticket.correlative ?? '-' },
    { title: 'Titulo', dataIndex: 'title' },
    { title: 'Estado', dataIndex: 'status', render: (status: TicketStatus) => <StatusTag status={status} /> },
    { title: 'Prioridad', dataIndex: 'priority', render: (priority: Priority) => <PriorityTag priority={priority} /> },
    { title: 'Tipo', render: (_, ticket) => ticket.ticketType?.name ?? '-' },
    { title: 'Responsable', render: (_, ticket) => ticket.assignedTo?.name ?? '-' },
    {
      title: 'Fecha de creacion',
      dataIndex: 'createdAt',
      sorter: true,
      sortOrder: sortBy === 'createdAt' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Plazo',
      dataIndex: 'dueDate',
      sorter: true,
      sortOrder: sortBy === 'dueDate' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (_, ticket) => renderDueDate(ticket),
    },
  ];

  function openTicketDetail(ticket: Ticket) {
    navigate(`/tickets/${ticket.id}`, { state: { returnTo: `${location.pathname}${location.search}` } });
  }

  function handleTableChange(nextPagination: TablePaginationConfig, _filters: Record<string, unknown>, sorter: SorterResult<Ticket> | SorterResult<Ticket>[]) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = activeSorter?.field;
    setPage(nextPagination.current ?? 1);
    setPageSize(nextPagination.pageSize ?? pageSize);

    if ((field === 'createdAt' || field === 'dueDate') && activeSorter.order) {
      setSortBy(field);
      setSortOrder(activeSorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
  }

  return (
    <>
      <ModulePage
        title="Solicitudes"
        description={canManage ? 'Seguimiento global de solicitudes DOM.' : 'Solicitudes asignadas a su usuario.'}
        summaryCards={[
          { title: 'Total', value: totalTickets },
          { title: 'En pagina', value: tickets.length },
          { title: 'Vencidas pagina', value: tickets.filter(isTicketOverdue).length },
          { title: 'Finalizadas pagina', value: tickets.filter((ticket) => ticket.status === 'FINISHED').length },
          { title: 'Cerradas pagina', value: tickets.filter((ticket) => ticket.status === 'CLOSED').length },
        ]}
        actions={canManage ? <Button type="primary" icon={<Icon name="add" />} onClick={() => void openCreateTicketModal()}>Nueva solicitud</Button> : null}
      >
        <Tabs
          activeKey={trayFilter}
          items={trayOptions.map((item) => ({ key: item.key, label: `${item.label} (${trayCounts[item.key]})` }))}
          onChange={(key) => {
            setTrayFilter(key as TicketTray);
            setStatusFilter(undefined);
            setPage(1);
          }}
        />
        <Card className="filter-card">
          <Space wrap>
            <Input.Search
              allowClear
              className="filter-search"
              placeholder="Buscar por correlativo, titulo, descripcion, tipo, responsable o RUT"
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
            {canFilterByStatus ? (
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
            ) : null}
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
            <Select<string>
              allowClear
              className="filter-control"
              placeholder="Filtrar plazo"
              value={overdueFilter ? overdueFilterValue : undefined}
              options={[{ value: overdueFilterValue, label: 'Vencidas' }]}
              onChange={(value) => {
                setOverdueFilter(value === overdueFilterValue ? true : undefined);
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
          onChange={handleTableChange}
          pagination={{
            current: page,
            pageSize,
            total: totalTickets,
            showSizeChanger: true,
            pageSizeOptions: [8, 10, 20, 50],
          }}
          locale={{ emptyText }}
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
