import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useAutenticacion } from '@/hooks/useAutenticacion';
import { useConsulta } from '@/hooks/useConsulta';
import { areasService } from '@/services/areas/areas.service';
import { solicitudesService } from '@/services/solicitudes/solicitudes.service';
import { usuariosService } from '@/services/usuarios/usuarios.service';
import type { EstadoSolicitud } from '@/types/comun';

type AccionSolicitud =
  | 'asignar'
  | 'derivar'
  | 'estado'
  | 'observacion'
  | 'finalizar'
  | 'cerrar';

type FormularioAccion = {
  asignadoAId?: number;
  areaDestinoId?: number;
  estado?: EstadoSolicitud;
  comentario?: string;
};

const titulosAccion: Record<AccionSolicitud, string> = {
  asignar: 'Asignar solicitud',
  derivar: 'Derivar solicitud',
  estado: 'Cambiar estado',
  observacion: 'Agregar observacion',
  finalizar: 'Finalizar solicitud',
  cerrar: 'Cerrar solicitud',
};

export function PaginaDetalleSolicitud() {
  const { id } = useParams();
  const solicitudId = Number(id);
  const { sesion } = useAutenticacion();

  const consulta = useConsulta(
    () => solicitudesService.obtenerPorId(solicitudId),
    [solicitudId],
  );
  const adjuntos = useConsulta(
    () => solicitudesService.listarAdjuntos(solicitudId),
    [solicitudId],
  );
  const areas = useConsulta(() => areasService.listar(), []);
  const usuarios = useConsulta(() => usuariosService.listar(), []);
  const [form] = Form.useForm<FormularioAccion>();
  const [accionActiva, setAccionActiva] = useState<AccionSolicitud | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const areaDestinoSeleccionada = Form.useWatch('areaDestinoId', form);

  const puedeGestionar =
    sesion?.usuario.rol === 'ENCARGADO' || sesion?.usuario.rol === 'REEMPLAZO';
  const esTrabajador = sesion?.usuario.rol === 'TRABAJADOR';
  const trabajadoresArea = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      usuario.activo &&
      usuario.area.id === consulta.data?.areaActual.id,
  );
  const trabajadoresAreaDestino = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      usuario.activo &&
      usuario.area.id === areaDestinoSeleccionada,
  );

  function abrirAccion(accion: AccionSolicitud) {
    form.resetFields();
    setAccionActiva(accion);
  }

  async function ejecutarAccion(values: FormularioAccion) {
    if (!accionActiva) {
      return;
    }

    setGuardando(true);

    try {
      if (accionActiva === 'asignar' && values.asignadoAId) {
        await solicitudesService.asignar(solicitudId, {
          asignadoAId: values.asignadoAId,
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'derivar' && values.areaDestinoId && values.asignadoAId) {
        await solicitudesService.derivar(solicitudId, {
          areaDestinoId: values.areaDestinoId,
          asignadoAId: values.asignadoAId,
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'estado' && values.estado) {
        await solicitudesService.cambiarEstado(solicitudId, {
          estado: values.estado,
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'observacion' && values.comentario) {
        await solicitudesService.agregarObservacion(solicitudId, {
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'finalizar') {
        await solicitudesService.finalizar(solicitudId, {
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'cerrar') {
        await solicitudesService.cerrar(solicitudId, {
          comentario: values.comentario,
        });
      }

      message.success('Solicitud actualizada');
      setAccionActiva(null);
      await consulta.refetch();
      await adjuntos.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible actualizar');
    } finally {
      setGuardando(false);
    }
  }

  async function subirAdjunto(archivo: File) {
    setSubiendo(true);

    try {
      await solicitudesService.subirAdjunto(solicitudId, archivo);
      message.success('Adjunto subido');
      await adjuntos.refetch();
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible subir el adjunto');
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminarAdjunto(adjuntoId: number) {
    try {
      await solicitudesService.eliminarAdjunto(adjuntoId);
      message.success('Adjunto eliminado');
      await adjuntos.refetch();
      await consulta.refetch();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible eliminar');
    }
  }

  return (
    <PaginaModulo
      titulo={`Detalle de Solicitud #${id ?? ''}`}
      descripcion="Vista conectada al backend para mostrar informacion base e historial."
    >
      <EstadoConsulta
        loading={consulta.loading}
        error={consulta.error}
        data={consulta.data}
        empty={!consulta.data}
        emptyDescription="No fue posible cargar la solicitud."
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={15}>
            <Card
              className="rounded-3xl"
              title="Informacion principal"
              extra={
                <Space wrap>
                  {puedeGestionar ? (
                    <>
                      <Button onClick={() => abrirAccion('asignar')}>Asignar</Button>
                      <Button onClick={() => abrirAccion('derivar')}>Derivar</Button>
                      <Button onClick={() => abrirAccion('cerrar')}>Cerrar</Button>
                    </>
                  ) : null}
                  {esTrabajador ? (
                    <>
                      <Button onClick={() => abrirAccion('estado')}>
                        Cambiar estado
                      </Button>
                      <Button onClick={() => abrirAccion('observacion')}>
                        Observacion
                      </Button>
                      <Button onClick={() => abrirAccion('finalizar')}>
                        Finalizar
                      </Button>
                    </>
                  ) : null}
                </Space>
              }
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Titulo">
                  {consulta.data?.titulo}
                </Descriptions.Item>
                <Descriptions.Item label="Estado">
                  <Space>
                    <Tag color={consulta.data?.estaVencida ? 'red' : 'processing'}>
                      {consulta.data?.estadoActual}
                    </Tag>
                    {consulta.data?.estaVencida ? (
                      <Tag color="orange">Vencida</Tag>
                    ) : null}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Area actual">
                  {consulta.data?.areaActual.nombre}
                </Descriptions.Item>
                <Descriptions.Item label="Tipo de solicitud">
                  {consulta.data?.tipoSolicitud.nombre}
                </Descriptions.Item>
                <Descriptions.Item label="Asignado a">
                  {consulta.data?.asignadoA
                    ? `${consulta.data.asignadoA.nombres} ${consulta.data.asignadoA.apellidos}`
                    : 'Sin asignacion'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} xl={9}>
            <Space direction="vertical" size={16} className="w-full">
              <Card className="rounded-3xl" title="Descripcion">
                <Typography.Paragraph className="!mb-0">
                  {consulta.data?.descripcion}
                </Typography.Paragraph>
              </Card>
              <Card
                className="rounded-3xl"
                title="Adjuntos"
                extra={
                  <Upload
                    showUploadList={false}
                    beforeUpload={(archivo) => {
                      void subirAdjunto(archivo);
                      return false;
                    }}
                  >
                    <Button loading={subiendo}>Subir adjunto</Button>
                  </Upload>
                }
              >
                <EstadoConsulta
                  loading={adjuntos.loading}
                  error={adjuntos.error}
                  data={adjuntos.data}
                  empty={(adjuntos.data?.length ?? 0) === 0}
                  emptyDescription="No hay adjuntos."
                >
                  <List
                    dataSource={adjuntos.data ?? []}
                    renderItem={(adjunto) => (
                      <List.Item
                        actions={[
                          <Button
                            key="eliminar"
                            danger
                            onClick={() => void eliminarAdjunto(adjunto.id)}
                          >
                            Eliminar
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={adjunto.nombreOriginal}
                          description={`${Math.round(adjunto.tamano / 1024)} KB`}
                        />
                      </List.Item>
                    )}
                  />
                </EstadoConsulta>
              </Card>
              <Card className="rounded-3xl" title="Historial reciente">
                <Space direction="vertical" className="w-full">
                  {consulta.data?.historialEntradas.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-municipal-100 p-3"
                    >
                      <Typography.Text strong>{item.accion}</Typography.Text>
                      <Typography.Paragraph className="!mb-0 !mt-2">
                        {item.comentario || 'Sin comentario'}
                      </Typography.Paragraph>
                    </div>
                  ))}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </EstadoConsulta>

      <Modal
        title={accionActiva ? titulosAccion[accionActiva] : ''}
        open={Boolean(accionActiva)}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={() => setAccionActiva(null)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void ejecutarAccion(values)}
        >
          {accionActiva === 'asignar' ? (
            <Form.Item
              label="Trabajador"
              name="asignadoAId"
              rules={[{ required: true, message: 'Seleccione un trabajador' }]}
            >
              <Select
                loading={usuarios.loading}
                options={trabajadoresArea.map((usuario) => ({
                  label: `${usuario.nombres} ${usuario.apellidos}`,
                  value: usuario.id,
                }))}
              />
            </Form.Item>
          ) : null}

          {accionActiva === 'derivar' ? (
            <Form.Item
              label="Area destino"
              name="areaDestinoId"
              rules={[{ required: true, message: 'Seleccione el area destino' }]}
            >
              <Select
                loading={areas.loading}
                onChange={() => form.setFieldValue('asignadoAId', undefined)}
                options={(areas.data ?? [])
                  .filter((area) => area.activo && area.id !== consulta.data?.areaActual.id)
                  .map((area) => ({ label: area.nombre, value: area.id }))}
              />
            </Form.Item>
          ) : null}

          {accionActiva === 'derivar' ? (
            <Form.Item
              label="Encargado de la solicitud"
              name="asignadoAId"
              rules={[{ required: true, message: 'Seleccione un encargado' }]}
            >
              <Select
                disabled={!areaDestinoSeleccionada}
                loading={usuarios.loading}
                placeholder={
                  areaDestinoSeleccionada
                    ? 'Seleccione un trabajador'
                    : 'Seleccione el area destino primero'
                }
                options={trabajadoresAreaDestino.map((usuario) => ({
                  label: `${usuario.nombres} ${usuario.apellidos}`,
                  value: usuario.id,
                }))}
              />
            </Form.Item>
          ) : null}

          {accionActiva === 'estado' ? (
            <Form.Item
              label="Estado"
              name="estado"
              rules={[{ required: true, message: 'Seleccione el estado' }]}
            >
              <Select<EstadoSolicitud>
                options={[
                  { label: 'Ingresada', value: 'INGRESADA' },
                  { label: 'En proceso', value: 'EN_PROCESO' },
                  {
                    label: 'Pendiente informacion',
                    value: 'PENDIENTE_INFORMACION',
                  },
                  { label: 'Derivada', value: 'DERIVADA' },
                ]}
              />
            </Form.Item>
          ) : null}

          <Form.Item label="Comentario">
            <Typography.Paragraph type="secondary">
              El comentario quedara registrado en el historial.
            </Typography.Paragraph>
            <Form.Item
              name="comentario"
              noStyle
              rules={[
                {
                  required: accionActiva === 'observacion',
                  message: 'Ingrese una observacion',
                },
              ]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>
    </PaginaModulo>
  );
}
