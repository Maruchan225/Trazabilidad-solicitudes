import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from 'antd';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FormularioUsuario } from '@/componentes/usuarios/FormularioUsuario';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagActivo } from '@/componentes/ui/tags/TagActivo';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { areasService } from '@/servicios/areas/areas.service';
import { usuariosService } from '@/servicios/usuarios/usuarios.service';
import type { RolUsuario } from '@/tipos/comun';
import type { Usuario, UsuarioPayload } from '@/tipos/usuarios';
import {
  mensajeContiene,
} from '@/utilidades/crud';
import { puedeGestionarCatalogos } from '@/utilidades/permisos';
import {
  construirPayloadUsuario,
  obtenerValoresFormularioUsuario,
} from '@/utilidades/usuarios';
import {
  OPCIONES_ESTADO_ACTIVO,
  OPCIONES_FILTRO_ROL_USUARIO,
  mapearOpcionesAreas,
} from '@/utilidades/opciones';

export function PaginaUsuarios() {
  const { sesion } = useAutenticacion();
  const [rolFiltro, setRolFiltro] = useState<RolUsuario>();
  const [areaFiltro, setAreaFiltro] = useState<number>();
  const [activoFiltro, setActivoFiltro] = useState<'activo' | 'inactivo'>();
  const [busqueda, setBusqueda] = useState('');
  const consulta = useConsulta(
    () =>
      usuariosService.listar({
        busqueda: busqueda.trim() || undefined,
        rol: rolFiltro,
        areaId: areaFiltro,
        activo:
          activoFiltro === undefined ? undefined : activoFiltro === 'activo',
      }),
    [busqueda, rolFiltro, areaFiltro, activoFiltro],
  );
  const areas = useConsulta(() => areasService.listar(), []);
  const [form] = Form.useForm<UsuarioPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const { loading: guardando, ejecutar } = useMutacion();
  const usuarios = consulta.data ?? [];
  const areasActivas = (areas.data ?? []).filter((area) => area.activo);
  const puedeGestionar = puedeGestionarCatalogos(sesion?.usuario.rol);
  const filtrosArea = mapearOpcionesAreas(areasActivas);

  function cerrarModal() {
    setModalAbierto(false);
  }

  function abrirCrear() {
    setUsuarioEditando(null);
    form.resetFields();
    form.setFieldsValue(obtenerValoresFormularioUsuario());
    setModalAbierto(true);
  }

  function abrirEditar(usuario: Usuario) {
    setUsuarioEditando(usuario);
    form.setFieldsValue(obtenerValoresFormularioUsuario(usuario));
    setModalAbierto(true);
  }

  async function guardar(values: UsuarioPayload) {
    const payload = construirPayloadUsuario(values);

    await ejecutar(
      () =>
        usuarioEditando
          ? usuariosService.actualizar(usuarioEditando.id, payload)
          : usuariosService.crear({
              ...payload,
              contrasena: values.contrasena?.trim() ?? '',
            }),
      {
        mensajeExito: usuarioEditando ? 'Usuario actualizado' : 'Usuario creado',
        mensajeError: 'No fue posible guardar',
        onSuccess: async () => {
          cerrarModal();
          await consulta.refetch();
        },
        onError: async (error, textoError) => {
          if (mensajeContiene(error, 'correo')) {
            form.setFields([{ name: 'email', errors: [textoError] }]);
          }

          message.error(textoError);
        },
      },
    );
  }

  async function eliminar(usuario: Usuario) {
    await ejecutar(() => usuariosService.eliminar(usuario.id), {
      mensajeExito: 'Usuario eliminado',
      mensajeError: 'No fue posible eliminar',
      onSuccess: async () => {
        await consulta.refetch();
      },
    });
  }

  return (
    <PaginaModulo
      titulo="Usuarios"
      descripcion="Listado de usuarios y sus roles dentro del sistema municipal."
    >
      <Card
        className="rounded-3xl"
        extra={
          puedeGestionar ? (
            <Button type="primary" onClick={abrirCrear}>Nuevo usuario</Button>
          ) : null
        }
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={usuarios.length === 0}
          emptyDescription="No hay usuarios registrados."
        >
          <Space wrap className="mb-4">
            <Input.Search
              allowClear
              className="min-w-64"
              placeholder="Buscar por nombre, correo, rol o area"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <Select<RolUsuario>
              allowClear
              className="min-w-40"
              placeholder="Filtrar rol"
              value={rolFiltro}
              options={OPCIONES_FILTRO_ROL_USUARIO}
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
              options={OPCIONES_ESTADO_ACTIVO}
              onChange={setActivoFiltro}
            />
            <Button
              onClick={() => {
                setBusqueda('');
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
            dataSource={usuarios}
            columns={[
              { title: 'ID', dataIndex: 'id', sorter: (a, b) => a.id - b.id },
              {
                title: 'Nombre',
                sorter: (a, b) =>
                  `${a.nombres} ${a.apellidos}`.localeCompare(
                    `${b.nombres} ${b.apellidos}`,
                  ),
                render: (_, record) => (
                  <Link to={`/usuarios/${record.id}`}>
                    {`${record.nombres} ${record.apellidos}`}
                  </Link>
                ),
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
                title: 'Solicitudes',
                dataIndex: 'totalSolicitudes',
                sorter: (a, b) => a.totalSolicitudes - b.totalSolicitudes,
                render: (totalSolicitudes: number) => totalSolicitudes,
              },
              {
                title: 'Estado',
                dataIndex: 'activo',
                sorter: (a, b) => Number(a.activo) - Number(b.activo),
                render: (activo: boolean) => <TagActivo activo={activo} />,
              },
              {
                title: 'Acciones',
                render: (_, record) => (
                  puedeGestionar ? (
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
                  ) : null
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
        onCancel={cerrarModal}
        onOk={() => form.submit()}
      >
        <FormularioUsuario
          form={form}
          areas={areasActivas}
          loadingAreas={areas.loading}
          modo={usuarioEditando ? 'editar' : 'crear'}
          onFinish={(values) => void guardar(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
