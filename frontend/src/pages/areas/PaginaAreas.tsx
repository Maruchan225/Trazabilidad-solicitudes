import { Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useConsulta } from '@/hooks/useConsulta';
import { areasService } from '@/services/areas/areas.service';
import type { Area, AreaPayload } from '@/types/areas';

export function PaginaAreas() {
  const consulta = useConsulta(() => areasService.listar(), []);
  const [form] = Form.useForm<AreaPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [areaEditando, setAreaEditando] = useState<Area | null>(null);

  function abrirCrear() {
    setAreaEditando(null);
    form.resetFields();
    form.setFieldsValue({ activo: true });
    setModalAbierto(true);
  }

  function abrirEditar(area: Area) {
    setAreaEditando(area);
    form.setFieldsValue({
      nombre: area.nombre,
      descripcion: area.descripcion ?? undefined,
      activo: area.activo,
    });
    setModalAbierto(true);
  }

  async function guardar(values: AreaPayload) {
    setGuardando(true);

    try {
      if (areaEditando) {
        await areasService.actualizar(areaEditando.id, values);
        message.success('Area actualizada');
      } else {
        await areasService.crear(values);
        message.success('Area creada');
      }

      setModalAbierto(false);
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(area: Area) {
    try {
      await areasService.eliminar(area.id);
      message.success('Area eliminada');
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible eliminar');
    }
  }

  return (
    <PaginaModulo
      titulo="Areas"
      descripcion="Listado real de areas municipales obtenido desde el backend."
    >
      <Card
        className="rounded-3xl"
        extra={<Button type="primary" onClick={abrirCrear}>Nueva area</Button>}
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={(consulta.data?.length ?? 0) === 0}
          emptyDescription="No hay areas registradas."
        >
          <Table<Area>
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
                title: 'Descripcion',
                dataIndex: 'descripcion',
                sorter: (a, b) =>
                  (a.descripcion ?? '').localeCompare(b.descripcion ?? ''),
                render: (descripcion?: string | null) =>
                  descripcion || 'Sin descripcion',
              },
              {
                title: 'Estado',
                dataIndex: 'activo',
                sorter: (a, b) => Number(a.activo) - Number(b.activo),
                render: (activo: boolean) => (
                  <Tag color={activo ? 'green' : 'default'}>
                    {activo ? 'Activa' : 'Inactiva'}
                  </Tag>
                ),
              },
              {
                title: 'Acciones',
                render: (_, record) => (
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
                ),
              },
            ]}
          />
        </EstadoConsulta>
      </Card>

      <Modal
        title={areaEditando ? 'Editar area' : 'Nueva area'}
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
          <Form.Item label="Activa" name="activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PaginaModulo>
  );
}
