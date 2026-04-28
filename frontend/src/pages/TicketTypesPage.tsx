import { Button, Form, Input, InputNumber, Modal, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { ModulePage } from '../components/ModulePage';
import { ticketTypesService } from '../services/api';
import type { TicketType } from '../types/domain';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

export function TicketTypesPage() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  async function loadTicketTypes() {
    setLoading(true);
    try {
      setTicketTypes(await ticketTypesService.listTicketTypes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTicketTypes();
  }, []);

  async function createTicketType(values: { name: string; description?: string; slaDays: number }) {
    await ticketTypesService.createTicketType(values);
    setModalOpen(false);
    form.resetFields();
    await loadTicketTypes();
  }

  const columns: Columns<TicketType> = [
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'Descripcion', dataIndex: 'description', render: (value) => value || '-' },
    { title: 'SLA', dataIndex: 'slaDays', render: (value) => `${value} dias` },
    { title: 'Estado', render: (_, item) => <Tag color={item.active ? 'green' : 'red'}>{item.active ? 'Activo' : 'Inactivo'}</Tag> },
    {
      title: '',
      render: (_, item) => (
        <Button onClick={() => void (item.active ? ticketTypesService.disableTicketType(item.id) : ticketTypesService.enableTicketType(item.id)).then(loadTicketTypes)}>
          {item.active ? 'Deshabilitar' : 'Habilitar'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <ModulePage
        title="Tipos de solicitud"
        description="Configuracion de SLA por tipo."
        summaryCards={[
          { title: 'Total', value: ticketTypes.length },
          { title: 'Activos', value: ticketTypes.filter((ticketType) => ticketType.active).length },
          { title: 'Inactivos', value: ticketTypes.filter((ticketType) => !ticketType.active).length },
        ]}
        actions={<Button type="primary" icon={<Icon name="add" />} onClick={() => setModalOpen(true)}>Nuevo tipo</Button>}
      >
        <Table rowKey="id" loading={loading} columns={columns} dataSource={ticketTypes} />
      </ModulePage>
      <Modal title="Nuevo tipo de solicitud" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={createTicketType}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descripcion">
            <Input />
          </Form.Item>
          <Form.Item name="slaDays" label="Dias SLA" rules={[{ required: true, message: 'Ingrese los dias SLA' }]}>
            <InputNumber min={1} className="full-width" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
