import { Button, Form, Input, Modal, Select, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { ModulePage } from '../components/ModulePage';
import { RoleTag } from '../components/StatusTags';
import { usersService } from '../services/api';
import type { User, UserRole } from '../types/domain';
import { roleLabels } from '../types/domain';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(await usersService.listUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function createUser(values: { name: string; rut: string; email: string; password: string; role: UserRole }) {
    await usersService.createUser({ ...values, enabled: true });
    setModalOpen(false);
    form.resetFields();
    await loadUsers();
  }

  const columns: Columns<User> = [
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'RUT', dataIndex: 'rut', render: (rut?: string | null) => rut ?? '-' },
    { title: 'Correo', dataIndex: 'email' },
    { title: 'Rol', dataIndex: 'role', render: (role: UserRole) => <RoleTag role={role} /> },
    { title: 'Estado', dataIndex: 'enabled', render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'red'}>{enabled ? 'Activo' : 'Inactivo'}</Tag> },
  ];

  return (
    <>
      <ModulePage
        title="Usuarios"
        description="Administracion de usuarios del sistema."
        summaryCards={[
          { title: 'Total', value: users.length },
          { title: 'Activos', value: users.filter((user) => user.enabled).length },
          { title: 'Trabajadores', value: users.filter((user) => user.role === 'WORKER').length },
        ]}
        actions={<Button type="primary" icon={<Icon name="add" />} onClick={() => setModalOpen(true)}>Nuevo usuario</Button>}
      >
        <Table rowKey="id" loading={loading} columns={columns} dataSource={users} />
      </ModulePage>
      <Modal title="Nuevo usuario" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={createUser} initialValues={{ role: 'WORKER' }}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rut" label="RUT" rules={[{ required: true, message: 'Ingrese el RUT' }]}>
            <Input placeholder="12.345.678-9" />
          </Form.Item>
          <Form.Item name="email" label="Correo" rules={[{ required: true, type: 'email', message: 'Ingrese un correo valido' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Contrasena" rules={[{ required: true, min: 8, message: 'Ingrese al menos 8 caracteres' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
