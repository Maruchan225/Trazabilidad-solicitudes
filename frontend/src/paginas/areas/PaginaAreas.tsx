import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd';
import { useState } from 'react';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagActivo } from '@/componentes/ui/tags/TagActivo';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { areasService } from '@/servicios/areas/areas.service';
import type { Area, AreaPayload } from '@/tipos/areas';
import {
  esErrorApiConEstado,
  mensajeContiene,
  obtenerMensajeError,
} from '@/utilidades/crud';
import { puedeGestionarCatalogos } from '@/utilidades/permisos';

const MENSAJE_ERROR_GUARDAR = 'No fue posible guardar';
const MENSAJE_ERROR_ELIMINAR = 'No fue posible eliminar';
const MENSAJE_AREA_CON_USUARIOS =
  'No se puede eliminar el area ya que tiene usuarios asignados a ella.';

function obtenerPayloadInicial(area?: Area | null): Partial<AreaPayload> {
  if (!area) {
    return { activo: true };
  }

  return {
    nombre: area.nombre,
    descripcion: area.descripcion ?? undefined,
    activo: area.activo,
  };
}

function noSePuedeEliminarPorUsuariosAsignados(error: unknown) {
  if (esErrorApiConEstado(error, 409)) {
    return true;
  }

  return mensajeContiene(error, 'tiene usuarios asignados');
}

export function PaginaAreas() {
  const { message } = App.useApp();
  const { sesion } = useAutenticacion();
  const [modal, contextHolder] = Modal.useModal();
  const consulta = useConsulta(() => areasService.listar(), []);
  const [form] = Form.useForm<AreaPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [areaEditando, setAreaEditando] = useState<Area | null>(null);
  const { loading: guardando, ejecutar } = useMutacion();
  const areas = consulta.data ?? [];
  const puedeGestionar = puedeGestionarCatalogos(sesion?.usuario.rol);

  function cerrarModal() {
    setModalAbierto(false);
  }

  function abrirCrear() {
    setAreaEditando(null);
    form.resetFields();
    form.setFieldsValue(obtenerPayloadInicial());
    setModalAbierto(true);
  }

  function abrirEditar(area: Area) {
    setAreaEditando(area);
    form.setFieldsValue(obtenerPayloadInicial(area));
    setModalAbierto(true);
  }

  async function guardar(values: AreaPayload) {
    await ejecutar(
      () =>
        areaEditando
          ? areasService.actualizar(areaEditando.id, values)
          : areasService.crear(values),
      {
        mensajeExito: areaEditando
          ? 'Area actualizada con exito'
          : 'Area creada con exito',
        mensajeError: MENSAJE_ERROR_GUARDAR,
        onSuccess: async () => {
          cerrarModal();
          await consulta.refetch();
        },
      },
    );
  }

  async function eliminar(area: Area) {
    await ejecutar(() => areasService.eliminar(area.id), {
      mensajeExito: 'Area eliminada',
      mensajeError: MENSAJE_ERROR_ELIMINAR,
      onSuccess: async () => {
        await consulta.refetch();
      },
      onError: async (error) => {
        if (noSePuedeEliminarPorUsuariosAsignados(error)) {
          modal.warning({
            title: 'No se puede eliminar el area',
            content: MENSAJE_AREA_CON_USUARIOS,
          });
          return;
        }

        message.error(obtenerMensajeError(error, MENSAJE_ERROR_ELIMINAR));
      },
    });
  }

  const columnas = [
    { title: 'ID', dataIndex: 'id', sorter: (a: Area, b: Area) => a.id - b.id },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      sorter: (a: Area, b: Area) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Descripcion',
      dataIndex: 'descripcion',
      sorter: (a: Area, b: Area) =>
        (a.descripcion ?? '').localeCompare(b.descripcion ?? ''),
      render: (descripcion?: string | null) => descripcion || 'Sin descripcion',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      sorter: (a: Area, b: Area) => Number(a.activo) - Number(b.activo),
      render: (activo: boolean) => (
        <TagActivo activo={activo} textoActivo="Activa" textoInactivo="Inactiva" />
      ),
    },
    {
      title: 'Acciones',
      render: (_: unknown, record: Area) => (
        puedeGestionar ? (
          <Space>
            <Button onClick={() => abrirEditar(record)}>Editar</Button>
            <Popconfirm
              title="Eliminar area"
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
  ];

  return (
    <PaginaModulo
      titulo="Areas"
      descripcion="Listado de areas municipales."
    >
      {contextHolder}
      <Card
        className="rounded-3xl"
        extra={
          puedeGestionar ? (
            <Button type="primary" onClick={abrirCrear}>Nueva area</Button>
          ) : null
        }
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={areas.length === 0}
          emptyDescription="No hay areas registradas."
        >
          <Table<Area>
            pagination={false}
            rowKey="id"
            dataSource={areas}
            columns={columnas}
          />
        </EstadoConsulta>
      </Card>

      <Modal
        title={areaEditando ? 'Editar area' : 'Nueva area'}
        open={modalAbierto}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(values) => void guardar(values)}>
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: 'Ingrese el nombre' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Descripcion" name="descripcion">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Activa" name="activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PaginaModulo>
  );
}
