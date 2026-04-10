import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useConsulta } from '@/hooks/useConsulta';
import { tiposSolicitudService } from '@/services/tipos-solicitud/tiposSolicitud.service';
import type { TipoSolicitud, TipoSolicitudPayload } from '@/types/tiposSolicitud';

export function PaginaTiposSolicitud() {
  const consulta = useConsulta(() => tiposSolicitudService.listar(), []);
  const [form] = Form.useForm<TipoSolicitudPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoSolicitud | null>(null);

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
    setGuardando(true);

    try {
      if (tipoEditando) {
        await tiposSolicitudService.actualizar(tipoEditando.id, values);
        message.success('Tipo de solicitud actualizado');
      } else {
        await tiposSolicitudService.crear(values);
        message.success('Tipo de solicitud creado');
      }

      setModalAbierto(false);
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(tipoSolicitud: TipoSolicitud) {
    try {
      await tiposSolicitudService.eliminar(tipoSolicitud.id);
      message.success('Tipo de solicitud eliminado');
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible eliminar');
    }
  }

  return (
    <PaginaModulo
      titulo="Tipos de Solicitud"
      descripcion="Catalogo real de tipos de solicitud para la operacion municipal."
    >
      <Card
        className="rounded-3xl"
        extra={<Button type="primary" onClick={abrirCrear}>Nuevo tipo</Button>}
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={(consulta.data?.length ?? 0) === 0}
          emptyDescription="No hay tipos de solicitud registrados."
        >
          <Table<TipoSolicitud>
            pagination={false}
            rowKey="id"
            dataSource={consulta.data ?? []}
            columns={[
              { title: 'ID', dataIndex: 'id', sorter: (a, b) => a.id - b.id },
              {
                title: 'Nombre',
                dataIndex: 'nombre',
                sorter: (a, b) => a.nombre.localeCompare(b.nombre),
              },
              {
                title: 'Dias SLA',
                dataIndex: 'diasSla',
                sorter: (a, b) => (a.diasSla ?? 0) - (b.diasSla ?? 0),
                render: (diasSla?: number | null) => diasSla ?? 'Sin SLA',
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
                      title="Eliminar tipo"
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
        title={tipoEditando ? 'Editar tipo de solicitud' : 'Nuevo tipo de solicitud'}
        open={modalAbierto}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={() => setModalAbierto(false)}
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
