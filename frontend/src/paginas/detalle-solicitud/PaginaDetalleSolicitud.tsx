import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  List,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AccionSolicitud,
  FormularioAccionSolicitud,
  FormularioAccionSolicitudValores,
  TITULOS_ACCION_SOLICITUD,
} from '@/componentes/solicitudes/FormularioAccionSolicitud';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { areasService } from '@/servicios/areas/areas.service';
import { solicitudesService } from '@/servicios/solicitudes/solicitudes.service';
import { usuariosService } from '@/servicios/usuarios/usuarios.service';
import type { HistorialSolicitud } from '@/tipos/solicitudes';
import { esRolTrabajador, puedeGestionarSolicitudes } from '@/utilidades/permisos';

function obtenerNombreCompleto(
  usuario?: { nombres: string; apellidos: string } | null,
) {
  return usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Sin asignacion';
}

function describirEntradaHistorial(item: HistorialSolicitud) {
  const actor = obtenerNombreCompleto(item.usuario);

  if (item.accion === 'ASIGNADA') {
    const origen = obtenerNombreCompleto(item.asignadoOrigen);
    const destino = obtenerNombreCompleto(item.asignadoDestino);

    return `${actor} cambio el responsable de ${origen} a ${destino}.`;
  }

  if (item.accion === 'DERIVADA') {
    const areaOrigen = item.areaOrigen?.nombre ?? 'Sin area';
    const areaDestino = item.areaDestino?.nombre ?? 'Sin area';
    const destino = obtenerNombreCompleto(item.asignadoDestino);

    return `${actor} derivo la solicitud desde ${areaOrigen} a ${areaDestino} y la dejo a cargo de ${destino}.`;
  }

  if (item.accion === 'ESTADO_CAMBIADO' && item.estadoOrigen && item.estadoDestino) {
    return `${actor} cambio el estado de ${item.estadoOrigen} a ${item.estadoDestino}.`;
  }

  if (item.accion === 'CREADA') {
    return `${actor} creo la solicitud.`;
  }

  if (item.accion === 'OBSERVACION') {
    return item.comentario
      ? `${actor} agrego una observacion: ${item.comentario}`
      : `${actor} agrego una observacion.`;
  }

  if (item.accion === 'FINALIZADA') {
    return item.comentario
      ? `${actor} finalizo la solicitud: ${item.comentario}`
      : `${actor} finalizo la solicitud.`;
  }

  if (item.accion === 'CERRADA') {
    return item.comentario
      ? `${actor} cerro la solicitud: ${item.comentario}`
      : `${actor} cerro la solicitud.`;
  }

  if (item.accion === 'ADJUNTO_SUBIDO') {
    return item.comentario
      ? `${actor} subio un adjunto: ${item.comentario}`
      : `${actor} subio un adjunto.`;
  }

  if (item.accion === 'ADJUNTO_ELIMINADO') {
    return item.comentario
      ? `${actor} elimino un adjunto: ${item.comentario}`
      : `${actor} elimino un adjunto.`;
  }

  if (item.accion === 'ELIMINADA') {
    return item.comentario
      ? `${actor} elimino la solicitud: ${item.comentario}`
      : `${actor} elimino la solicitud.`;
  }

  return item.comentario ? `${actor}: ${item.comentario}` : `${actor} realizo la accion ${item.accion}.`;
}

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
  const [form] = Form.useForm<FormularioAccionSolicitudValores>();
  const [accionActiva, setAccionActiva] = useState<AccionSolicitud | null>(null);
  const { loading: guardando, ejecutar } = useMutacion();
  const { loading: subiendo, ejecutar: ejecutarAdjunto } = useMutacion();
  const areaDestinoSeleccionada = Form.useWatch('areaDestinoId', form);

  const puedeGestionar = puedeGestionarSolicitudes(sesion?.usuario.rol);
  const esTrabajador = esRolTrabajador(sesion?.usuario.rol);
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
  const areasDerivables = (areas.data ?? []).filter(
    (area) => area.activo && area.id !== consulta.data?.areaActual.id,
  );

  function abrirAccion(accion: AccionSolicitud) {
    form.resetFields();
    setAccionActiva(accion);
  }

  async function ejecutarAccion(values: FormularioAccionSolicitudValores) {
    if (!accionActiva) {
      return;
    }

    await ejecutar(async () => {
      if (accionActiva === 'asignar' && values.asignadoAId) {
        return solicitudesService.asignar(solicitudId, {
          asignadoAId: values.asignadoAId,
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'derivar' && values.areaDestinoId && values.asignadoAId) {
        return solicitudesService.derivar(solicitudId, {
          areaDestinoId: values.areaDestinoId,
          asignadoAId: values.asignadoAId,
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'estado' && values.estado) {
        return solicitudesService.cambiarEstado(solicitudId, {
          estado: values.estado,
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'observacion' && values.comentario) {
        return solicitudesService.agregarObservacion(solicitudId, {
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'finalizar') {
        return solicitudesService.finalizar(solicitudId, {
          comentario: values.comentario,
        });
      }

      if (accionActiva === 'cerrar') {
        return solicitudesService.cerrar(solicitudId, {
          comentario: values.comentario,
        });
      }

      throw new Error('No fue posible actualizar');
    }, {
      mensajeExito: 'Solicitud actualizada',
      mensajeError: 'No fue posible actualizar',
      onSuccess: async () => {
        setAccionActiva(null);
        await consulta.refetch();
        await adjuntos.refetch();
      },
    });
  }

  async function subirAdjunto(archivo: File) {
    await ejecutarAdjunto(() => solicitudesService.subirAdjunto(solicitudId, archivo), {
      mensajeExito: 'Adjunto subido',
      mensajeError: 'No fue posible subir el adjunto',
      onSuccess: async () => {
        await adjuntos.refetch();
        await consulta.refetch();
      },
    });
  }

  async function eliminarAdjunto(adjuntoId: number) {
    await ejecutarAdjunto(() => solicitudesService.eliminarAdjunto(adjuntoId), {
      mensajeExito: 'Adjunto eliminado',
      mensajeError: 'No fue posible eliminar',
      onSuccess: async () => {
        await adjuntos.refetch();
        await consulta.refetch();
      },
    });
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
                    <TagEstadoSolicitud
                      estado={consulta.data?.estadoActual ?? 'INGRESADA'}
                      estaVencida={consulta.data?.estaVencida}
                    />
                    {consulta.data?.estaVencida &&
                    consulta.data?.estadoActual !== 'VENCIDA' ? (
                      <Tag color="#111827">Vencida</Tag>
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
                        {describirEntradaHistorial(item)}
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
        title={accionActiva ? TITULOS_ACCION_SOLICITUD[accionActiva] : ''}
        open={Boolean(accionActiva)}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={() => setAccionActiva(null)}
        onOk={() => form.submit()}
      >
        <FormularioAccionSolicitud
          accionActiva={accionActiva}
          form={form}
          areasDisponibles={areasDerivables}
          trabajadoresArea={trabajadoresArea}
          trabajadoresAreaDestino={trabajadoresAreaDestino}
          areaDestinoSeleccionada={areaDestinoSeleccionada}
          loadingAreas={areas.loading}
          loadingUsuarios={usuarios.loading}
          onFinish={(values) => void ejecutarAccion(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
