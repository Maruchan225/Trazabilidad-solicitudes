import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useConsulta } from '@/hooks/useConsulta';
import { areasService } from '@/services/areas/areas.service';
import { usuariosService } from '@/services/usuarios/usuarios.service';
import type { RolUsuario } from '@/types/comun';
import type { Usuario, UsuarioPayload } from '@/types/usuarios';

export function PaginaUsuarios() {
  const consulta = useConsulta(() => usuariosService.listar(), []);
  const areas = useConsulta(() => areasService.listar(), []);
  const [form] = Form.useForm<UsuarioPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [rolFiltro, setRolFiltro] = useState<RolUsuario>();
  const [areaFiltro, setAreaFiltro] = useState<number>();
  const [activoFiltro, setActivoFiltro] = useState<'activo' | 'inactivo'>();
  const filtrosRol = Array.from(
    new Set((consulta.data ?? []).map((usuario) => usuario.rol)),
  ).map((rol) => ({ label: rol, value: rol }));
  const filtrosArea = (areas.data ?? [])
    .filter((area) => area.activo)
    .map((area) => ({ label: area.nombre, value: area.id }));
  const usuariosFiltrados = (consulta.data ?? []).filter(
    (usuario) =>
      (!rolFiltro || usuario.rol === rolFiltro) &&
      (!areaFiltro || usuario.area?.id === areaFiltro) &&
      (!activoFiltro || usuario.activo === (activoFiltro === 'activo')),
  );

  function abrirCrear() {
    setUsuarioEditando(null);
    form.resetFields();
    form.setFieldsValue({ rol: 'TRABAJADOR', activo: true });
    setModalAbierto(true);
  }

  function abrirEditar(usuario: Usuario) {
    setUsuarioEditando(usuario);
    form.setFieldsValue({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono ?? undefined,
      rol: usuario.rol,
      areaId: usuario.area.id,
      activo: usuario.activo,
      contrasena: undefined,
    });
    setModalAbierto(true);
  }

  async function guardar(values: UsuarioPayload) {
    setGuardando(true);

    const contrasena = values.contrasena?.trim();
    const telefono = values.telefono?.trim();
    const payload: UsuarioPayload = {
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      email: values.email.trim().toLowerCase(),
      telefono: telefono ? telefono : undefined,
      rol: values.rol,
      areaId: values.areaId,
      activo: values.activo ?? true,
      contrasena: contrasena ? contrasena : undefined,
    };

    try {
      if (usuarioEditando) {
        await usuariosService.actualizar(usuarioEditando.id, payload);
        message.success('Usuario actualizado');
      } else {
        await usuariosService.crear({
          ...payload,
          contrasena: contrasena ?? '',
        });
        message.success('Usuario creado');
      }

      setModalAbierto(false);
      await consulta.refetch();
    } catch (error) {
      const textoError =
        error instanceof Error ? error.message : 'No fue posible guardar';

      if (textoError.toLowerCase().includes('correo')) {
        form.setFields([{ name: 'email', errors: [textoError] }]);
      }

      message.error(textoError);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(usuario: Usuario) {
    try {
      await usuariosService.eliminar(usuario.id);
      message.success('Usuario eliminado');
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible eliminar');
    }
  }

  return (
    <PaginaModulo
      titulo="Usuarios"
      descripcion="Listado real de usuarios y sus roles dentro del sistema municipal."
    >
      <Card
        className="rounded-3xl"
        extra={<Button type="primary" onClick={abrirCrear}>Nuevo usuario</Button>}
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={(consulta.data?.length ?? 0) === 0}
          emptyDescription="No hay usuarios registrados."
        >
          <Space wrap className="mb-4">
            <Select<RolUsuario>
              allowClear
              className="min-w-40"
              placeholder="Filtrar rol"
              value={rolFiltro}
              options={filtrosRol}
              onChange={setRolFiltro}
            />
            <Select<number>
              allowClear
              className="min-w-44"
              placeholder="Filtrar area"
              value={areaFiltro}
              options={filtrosArea}
              onChange={setAreaFiltro}
            />
            <Select<'activo' | 'inactivo'>
              allowClear
              className="min-w-40"
              placeholder="Filtrar estado"
              value={activoFiltro}
              options={[
                { label: 'Activo', value: 'activo' },
                { label: 'Inactivo', value: 'inactivo' },
              ]}
              onChange={setActivoFiltro}
            />
            <Button
              onClick={() => {
                setRolFiltro(undefined);
                setAreaFiltro(undefined);
                setActivoFiltro(undefined);
              }}
            >
              Limpiar filtros
            </Button>
          </Space>

          <Table<Usuario>
            pagination={{ pageSize: 8 }}
            rowKey="id"
            dataSource={usuariosFiltrados}
            columns={[
              { title: 'ID', dataIndex: 'id', sorter: (a, b) => a.id - b.id },
              {
                title: 'Nombre',
                sorter: (a, b) =>
                  `${a.nombres} ${a.apellidos}`.localeCompare(
                    `${b.nombres} ${b.apellidos}`,
                  ),
                render: (_, record) => `${record.nombres} ${record.apellidos}`,
              },
              {
                title: 'Correo',
                dataIndex: 'email',
                sorter: (a, b) => a.email.localeCompare(b.email),
              },
              {
                title: 'Rol',
                dataIndex: 'rol',
                sorter: (a, b) => a.rol.localeCompare(b.rol),
              },
              {
                title: 'Area',
                sorter: (a, b) =>
                  (a.area?.nombre ?? '').localeCompare(b.area?.nombre ?? ''),
                render: (_, record) => record.area?.nombre ?? 'Sin area',
              },
              {
                title: 'Estado',
                dataIndex: 'activo',
                sorter: (a, b) => Number(a.activo) - Number(b.activo),
                render: (activo: boolean) => (
                  <Tag color={activo ? 'green' : 'default'}>
                    {activo ? 'Activo' : 'Inactivo'}
                  </Tag>
                ),
              },
              {
                title: 'Acciones',
                render: (_, record) => (
                  <Space>
                    <Button onClick={() => abrirEditar(record)}>Editar</Button>
                    <Popconfirm
                      title="Eliminar usuario"
                      description="Esta accion eliminara o desactivara el registro."
                      okText="Eliminar"
                      cancelText="Cancelar"
                      onConfirm={() => void eliminar(record)}
                    >
                      <Button danger>Eliminar</Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </EstadoConsulta>
      </Card>

      <Modal
        title={usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
        open={modalAbierto}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={() => setModalAbierto(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(values) => void guardar(values)}>
          <Form.Item
            label="Nombres"
            name="nombres"
            rules={[
              { required: true, message: 'Ingrese los nombres' },
              { whitespace: true, message: 'Ingrese los nombres' },
              { min: 2, message: 'Los nombres deben tener al menos 2 caracteres' },
              { max: 120, message: 'Los nombres no pueden superar 120 caracteres' },
            ]}
          >
            <Input maxLength={120} showCount />
          </Form.Item>
          <Form.Item
            label="Apellidos"
            name="apellidos"
            rules={[
              { required: true, message: 'Ingrese los apellidos' },
              { whitespace: true, message: 'Ingrese los apellidos' },
              { min: 2, message: 'Los apellidos deben tener al menos 2 caracteres' },
              { max: 120, message: 'Los apellidos no pueden superar 120 caracteres' },
            ]}
          >
            <Input maxLength={120} showCount />
          </Form.Item>
          <Form.Item
            label="Correo"
            name="email"
            rules={[
              { required: true, message: 'Ingrese el correo' },
              { type: 'email', message: 'Ingrese un correo valido' },
            ]}
          >
            <Input maxLength={254} />
          </Form.Item>
          <Form.Item
            label={usuarioEditando ? 'Nueva contrasena' : 'Contrasena'}
            name="contrasena"
            rules={[
              {
                required: !usuarioEditando,
                message: 'Ingrese la contrasena',
              },
              { whitespace: true, message: 'Ingrese la contrasena' },
              { min: 8, message: 'Debe tener al menos 8 caracteres' },
              { max: 128, message: 'No puede superar 128 caracteres' },
            ]}
          >
            <Input.Password maxLength={128} />
          </Form.Item>
          <Form.Item
            label="Telefono"
            name="telefono"
            rules={[
              { max: 30, message: 'El telefono no puede superar 30 caracteres' },
            ]}
          >
            <Input maxLength={30} />
          </Form.Item>
          <Form.Item
            label="Rol"
            name="rol"
            rules={[{ required: true, message: 'Seleccione un rol' }]}
          >
            <Select<RolUsuario>
              options={[
                { label: 'Encargado', value: 'ENCARGADO' },
                { label: 'Reemplazo', value: 'REEMPLAZO' },
                { label: 'Trabajador', value: 'TRABAJADOR' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Area"
            name="areaId"
            rules={[{ required: true, message: 'Seleccione un area' }]}
          >
            <Select
              loading={areas.loading}
              options={(areas.data ?? [])
                .filter((area) => area.activo)
                .map((area) => ({
                  label: area.nombre,
                  value: area.id,
                }))}
            />
          </Form.Item>
          <Form.Item label="Activo" name="activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PaginaModulo>
  );
}
