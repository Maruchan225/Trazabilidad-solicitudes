import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagActivo } from '@/componentes/ui/tags/TagActivo';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { tiposSolicitudService } from '@/servicios/tipos-solicitud/tiposSolicitud.service';
import type { TipoSolicitud, TipoSolicitudPayload } from '@/tipos/tiposSolicitud';
import { puedeGestionarCatalogos } from '@/utilidades/permisos';

export function PaginaTiposSolicitud() {
  const { sesion } = useAutenticacion();
  const consulta = useConsulta(() => tiposSolicitudService.listar(), []);
  const [form] = Form.useForm<TipoSolicitudPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoSolicitud | null>(null);
  const { loading: guardando, ejecutar } = useMutacion();
  const tiposSolicitud = consulta.data ?? [];
  const puedeGestionar = puedeGestionarCatalogos(sesion?.usuario.rol);

  function cerrarModal() {
    setModalAbierto(false);
  }

  function abrirCrear() {
    setTipoEditando(null);
    form.resetFields();
    form.setFieldsValue({ activo: true });
    setModalAbierto(true);
  }

  function abrirEditar(tipoSolicitud: TipoSolicitud) {
    setTipoEditando(tipoSolicitud);
    form.setFieldsValue({
      nombre: tipoSolicitud.nombre,
      descripcion: tipoSolicitud.descripcion ?? undefined,
      diasSla: tipoSolicitud.diasSla ?? undefined,
      activo: tipoSolicitud.activo,
    });
    setModalAbierto(true);
  }

  async function guardar(values: TipoSolicitudPayload) {
    await ejecutar(
      () =>
        tipoEditando
          ? tiposSolicitudService.actualizar(tipoEditando.id, values)
          : tiposSolicitudService.crear(values),
      {
        mensajeExito: tipoEditando
          ? 'Tipo de solicitud actualizado con exito'
          : 'Tipo de solicitud creado con exito',
        mensajeError: 'No fue posible guardar',
        onSuccess: async () => {
          cerrarModal();
          await consulta.refetch();
        },
      },
    );
  }

  async function eliminar(tipoSolicitud: TipoSolicitud) {
    await ejecutar(() => tiposSolicitudService.eliminar(tipoSolicitud.id), {
      mensajeExito: 'Tipo de solicitud eliminado',
      mensajeError: 'No fue posible eliminar',
      onSuccess: async () => {
        await consulta.refetch();
      },
    });
  }

  const columnas = [
    { title: 'ID', dataIndex: 'id', sorter: (a: TipoSolicitud, b: TipoSolicitud) => a.id - b.id },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      sorter: (a: TipoSolicitud, b: TipoSolicitud) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Dias SLA',
      dataIndex: 'diasSla',
      sorter: (a: TipoSolicitud, b: TipoSolicitud) => (a.diasSla ?? 0) - (b.diasSla ?? 0),
      render: (diasSla?: number | null) => diasSla ?? 'Sin SLA',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      sorter: (a: TipoSolicitud, b: TipoSolicitud) => Number(a.activo) - Number(b.activo),
      render: (activo: boolean) => <TagActivo activo={activo} />,
    },
    {
      title: 'Acciones',
      render: (_: unknown, record: TipoSolicitud) => (
        puedeGestionar ? (
          <Space>
            <Button onClick={() => abrirEditar(record)}>Editar</Button>
            <Popconfirm
              title="Eliminar tipo"
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
      titulo="Tipos de Solicitud"
      descripcion="Catalogo de tipos de solicitud para la operacion municipal."
    >
      <Card
        className="rounded-3xl"
        extra={
          puedeGestionar ? (
            <Button type="primary" onClick={abrirCrear}>Nuevo tipo</Button>
          ) : null
        }
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={tiposSolicitud.length === 0}
          emptyDescription="No hay tipos de solicitud registrados."
        >
          <Table<TipoSolicitud>
            pagination={false}
            rowKey="id"
            dataSource={tiposSolicitud}
            columns={columnas}
          />
        </EstadoConsulta>
      </Card>

      <Modal
        title={tipoEditando ? 'Editar tipo de solicitud' : 'Nuevo tipo de solicitud'}
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
          <Form.Item label="Dias SLA" name="diasSla">
            <InputNumber min={1} max={365} className="w-full" />
          </Form.Item>
          <Form.Item label="Activo" name="activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PaginaModulo>
  );
}
