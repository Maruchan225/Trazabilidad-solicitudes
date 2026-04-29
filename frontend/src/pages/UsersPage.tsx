import { Alert, Button, Checkbox, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { ModulePage } from '../components/ModulePage';
import { RoleTag } from '../components/StatusTags';
import { usersService } from '../services/api';
import type { User, UserRole } from '../types/domain';
import { roleLabels } from '../types/domain';
import { formatRut } from '../utils/rut';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  function openCreateModal() {
    setEditingUser(null);
    setSaveError(null);
    form.resetFields();
    form.setFieldsValue({ role: 'WORKER', enabled: true });
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setSaveError(null);
    form.setFieldsValue({
      name: user.name,
      rut: user.rut,
      email: user.email,
      role: user.role,
      enabled: user.enabled,
      password: '',
    });
    setModalOpen(true);
  }

  async function saveUser(values: { name: string; rut: string; email: string; password?: string; role: UserRole; enabled?: boolean }) {
    setSaveError(null);
    const payload = {
      name: values.name,
      rut: formatRut(values.rut),
      email: values.email,
      role: values.role,
      enabled: values.enabled ?? false,
      ...(values.password ? { password: values.password } : {}),
    };

    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, payload);
      } else {
        await usersService.createUser({ ...payload, password: values.password ?? '' });
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No fue posible guardar el usuario');
      return;
    }

    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
    await loadUsers();
  }

  const columns: Columns<User> = [
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'RUT', dataIndex: 'rut', render: (rut?: string | null) => rut ?? '-' },
    { title: 'Correo', dataIndex: 'email' },
    { title: 'Rol', dataIndex: 'role', render: (role: UserRole) => <RoleTag role={role} /> },
    { title: 'Estado', dataIndex: 'enabled', render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'red'}>{enabled ? 'Activo' : 'Inactivo'}</Tag> },
    {
      title: 'Acciones',
      render: (_, user) => (
        <Space>
          <Button onClick={() => openEditModal(user)}>Editar</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ModulePage
        title="Usuarios"
        description="Administracion de usuarios del sistema."
        summaryCards={[
          { title: 'Total', value: users.length },
          { title: 'Activos', value: users.filter((user) => user.enabled).length },
          { title: 'Secretarios/as', value: users.filter((user) => user.role === 'SECRETARY').length },
          { title: 'Trabajadores', value: users.filter((user) => user.role === 'WORKER').length },
        ]}
        actions={<Button type="primary" icon={<Icon name="add" />} onClick={openCreateModal}>Nuevo usuario</Button>}
      >
        <Table rowKey="id" loading={loading} columns={columns} dataSource={users} />
      </ModulePage>
      <Modal
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingUser(null);
          setSaveError(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={saveUser} initialValues={{ role: 'WORKER', enabled: true }}>
          {saveError ? <Alert type="error" showIcon message={saveError} className="mb-16" /> : null}
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rut" label="RUT" rules={[{ required: true, message: 'Ingrese el RUT' }]}>
            <Input
              placeholder="12.345.678-9"
              onChange={(event) => {
                form.setFieldValue('rut', formatRut(event.target.value));
              }}
            />
          </Form.Item>
          <Form.Item name="email" label="Correo" rules={[{ required: true, type: 'email', message: 'Ingrese un correo valido' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? 'Nueva contrasena' : 'Contrasena'}
            rules={[{ required: !editingUser, min: 8, message: 'Ingrese al menos 8 caracteres' }]}
            extra={editingUser ? 'Deje este campo vacio para mantener la contrasena actual.' : undefined}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          {editingUser ? (
            <Form.Item name="enabled" valuePropName="checked">
              <Checkbox>Usuario activo</Checkbox>
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </>
  );
}
