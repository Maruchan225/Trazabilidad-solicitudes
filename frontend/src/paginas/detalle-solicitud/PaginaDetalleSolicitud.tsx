import {
  App,
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  List,
  Modal,
  Popconfirm,
  Row,
  Space,
  Typography,
  Upload,
} from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AccionSolicitud,
  FormularioAccionSolicitud,
  FormularioAccionSolicitudValores,
  TITULOS_ACCION_SOLICITUD,
} from '@/componentes/solicitudes/FormularioAccionSolicitud';
import { Icono } from '@/componentes/ui/Icono';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { TagPrioridad } from '@/componentes/ui/tags/TagPrioridad';
import { TagVencimientoSolicitud } from '@/componentes/ui/tags/TagVencimientoSolicitud';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { solicitudesService } from '@/servicios/solicitudes/solicitudes.service';
import { usuariosService } from '@/servicios/usuarios/usuarios.service';
import type { HistorialSolicitud } from '@/tipos/solicitudes';
import { obtenerMensajeError } from '@/utilidades/crud';
import { formatearFecha, formatearFechaHora } from '@/utilidades/fechas';
import { esRolTrabajador, puedeGestionarSolicitudes } from '@/utilidades/permisos';
import { formatearEstado } from '@/utilidades/reportes';
import {
  calcularDiasHastaVencimiento,
  obtenerEtiquetaVencimiento,
} from '@/utilidades/solicitudesOperativas';

const EXTENSIONES_ADJUNTOS_PERMITIDAS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
];
const TAMANO_MAXIMO_ADJUNTO_BYTES = 10 * 1024 * 1024;

function obtenerNombreCompleto(
  usuario?: { nombres: string; apellidos: string } | null,
) {
  return usuario
    ? `${usuario.nombres} ${usuario.apellidos}`
    : 'Sin responsable asignado (registro heredado)';
}

function describirEntradaHistorial(item: HistorialSolicitud) {
  const actor = obtenerNombreCompleto(item.usuario);

  if (item.accion === 'ASIGNADA') {
    const origen = obtenerNombreCompleto(item.asignadoOrigen);
    const destino = obtenerNombreCompleto(item.asignadoDestino);

    return `${actor} cambio el responsable de ${origen} a ${destino}.`;
  }

  if (item.accion === 'DERIVADA') {
    const origen = obtenerNombreCompleto(item.asignadoOrigen);
    const destino = obtenerNombreCompleto(item.asignadoDestino);

    return `${actor} derivo la solicitud desde ${origen} a ${destino}.`;
  }

  if (item.accion === 'ESTADO_CAMBIADO' && item.estadoOrigen && item.estadoDestino) {
    return `${actor} cambio el estado de ${formatearEstado(item.estadoOrigen)} a ${formatearEstado(item.estadoDestino)}.`;
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

type DetalleSolicitudLocationState = {
  returnTo?: string;
};

export function PaginaDetalleSolicitud() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const solicitudId = Number(id);
  const { sesion } = useAutenticacion();
  const retornoListado =
    (location.state as DetalleSolicitudLocationState | null)?.returnTo ??
    '/solicitudes';

  const consulta = useConsulta(
    () => solicitudesService.obtenerPorId(solicitudId),
    [solicitudId],
  );
  const adjuntos = useConsulta(
    () => solicitudesService.listarAdjuntos(solicitudId),
    [solicitudId],
  );
  const usuarios = useConsulta(() => usuariosService.listar(), []);
  const [form] = Form.useForm<FormularioAccionSolicitudValores>();
  const [accionActiva, setAccionActiva] = useState<AccionSolicitud | null>(null);
  const { loading: guardando, ejecutar } = useMutacion();
  const { loading: subiendo, ejecutar: ejecutarAdjunto } = useMutacion();

  const puedeGestionar = puedeGestionarSolicitudes(sesion?.usuario.rol);
  const esTrabajador = esRolTrabajador(sesion?.usuario.rol);
  const trabajadoresArea = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      usuario.activo,
  );
  const trabajadoresDerivables = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      usuario.activo &&
      usuario.id !== consulta.data?.asignadoA?.id,
  );
  const historialCompleto = [...(consulta.data?.historialEntradas ?? [])].reverse();
  const trabajadorPuedeCambiarEstado =
    consulta.data?.estadoPersistido !== 'FINALIZADA' &&
    consulta.data?.estadoPersistido !== 'CERRADA';
  const diasVencimiento = calcularDiasHastaVencimiento(
    consulta.data?.fechaVencimiento,
    consulta.data?.fechaCierre,
  );
  const etiquetaVencimiento = obtenerEtiquetaVencimiento(
    consulta.data?.fechaVencimiento,
    consulta.data?.fechaCierre,
    consulta.data?.estaVencida,
  );
  const accionGestionPrincipal =
    !consulta.data?.asignadoA
      ? 'asignar'
      : consulta.data?.estadoPersistido === 'FINALIZADA'
        ? 'cerrar'
        : 'derivar';
  const accionTrabajadorPrincipal =
    consulta.data?.estadoPersistido === 'EN_PROCESO' ||
    consulta.data?.estadoPersistido === 'PENDIENTE_INFORMACION'
      ? 'finalizar'
      : 'estado';

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

      if (accionActiva === 'derivar' && values.asignadoAId) {
        return solicitudesService.derivar(solicitudId, {
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
      mensajeExito: 'Solicitud actualizada con exito',
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
      mensajeExito: 'Adjunto subido con exito',
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

  function liberarUrlTemporal(url: string) {
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  }

  async function verAdjunto(adjuntoId: number) {
    try {
      const archivo = await solicitudesService.obtenerAdjuntoArchivo(adjuntoId);
      const url = URL.createObjectURL(archivo.blob);
      const ventana = window.open(url, '_blank', 'noopener,noreferrer');

      if (!ventana) {
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.target = '_blank';
        enlace.rel = 'noopener noreferrer';
        enlace.click();
      }

      liberarUrlTemporal(url);
    } catch (error) {
      void message.error(
        obtenerMensajeError(error, 'No fue posible abrir el adjunto'),
      );
    }
  }

  async function descargarAdjunto(adjuntoId: number) {
    try {
      const archivo = await solicitudesService.descargarAdjuntoArchivo(adjuntoId);
      const url = URL.createObjectURL(archivo.blob);
      const enlace = document.createElement('a');

      enlace.href = url;
      enlace.download = archivo.nombreArchivo;
      enlace.click();
      liberarUrlTemporal(url);
    } catch (error) {
      void message.error(
        obtenerMensajeError(error, 'No fue posible descargar el adjunto'),
      );
    }
  }

  function validarAdjuntoAntesDeSubir(archivo: File) {
    const nombreArchivo = archivo.name.toLowerCase();
    const extensionValida = EXTENSIONES_ADJUNTOS_PERMITIDAS.some((extension) =>
      nombreArchivo.endsWith(extension),
    );

    if (!extensionValida) {
      void message.error(
        'Formato no permitido. Use PDF, DOC, DOCX, JPG, JPEG o PNG.',
      );
      return Upload.LIST_IGNORE;
    }

    if (archivo.size > TAMANO_MAXIMO_ADJUNTO_BYTES) {
      void message.error('El archivo supera el limite de 10 MB.');
      return Upload.LIST_IGNORE;
    }

    void subirAdjunto(archivo);
    return Upload.LIST_IGNORE;
  }

  return (
    <PaginaModulo
      titulo={`Solicitud #${consulta.data?.correlativo ?? '-'}`}
      descripcion="Detalle operativo con foco en estado, responsable, vencimiento, prioridad y trazabilidad."
    >
      <Space direction="vertical" size={16} className="w-full">
        <Button
          icon={<Icono nombre="flecha-izquierda" />}
          className="w-fit"
          onClick={() => navigate(retornoListado)}
        >
          Volver
        </Button>

        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={!consulta.data}
          emptyDescription="No fue posible cargar la solicitud."
        >
          {consulta.data?.estaVencida ? (
            <Alert
              type="error"
              showIcon
              message={`Solicitud vencida. ${etiquetaVencimiento}.`}
            />
          ) : typeof diasVencimiento === 'number' && diasVencimiento >= 0 && diasVencimiento <= 3 ? (
            <Alert
              type="warning"
              showIcon
              message={`Solicitud por vencer. ${etiquetaVencimiento}.`}
            />
          ) : (
            <Alert
              type="success"
              showIcon
              message={`Solicitud en seguimiento normal. ${etiquetaVencimiento}.`}
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={15}>
              <Card
                className="rounded-3xl"
                title="Resumen operativo"
                extra={
                  <Space wrap>
                    {puedeGestionar ? (
                      <>
                        <Button
                          type={accionGestionPrincipal === 'asignar' ? 'primary' : 'default'}
                          onClick={() => abrirAccion('asignar')}
                        >
                          Asignar responsable
                        </Button>
                        <Button
                          type={accionGestionPrincipal === 'derivar' ? 'primary' : 'default'}
                          onClick={() => abrirAccion('derivar')}
                        >
                          Derivar a usuario
                        </Button>
                        <Button onClick={() => abrirAccion('estado')}>
                          Cambiar estado
                        </Button>
                        <Button
                          type={accionGestionPrincipal === 'cerrar' ? 'primary' : 'default'}
                          onClick={() => abrirAccion('cerrar')}
                        >
                          Cerrar solicitud
                        </Button>
                      </>
                    ) : null}
                    {esTrabajador ? (
                      <>
                        {trabajadorPuedeCambiarEstado ? (
                          <Button
                            type={accionTrabajadorPrincipal === 'estado' ? 'primary' : 'default'}
                            onClick={() => abrirAccion('estado')}
                          >
                            Cambiar estado
                          </Button>
                        ) : null}
                        <Button onClick={() => abrirAccion('observacion')}>
                          Observacion
                        </Button>
                        {trabajadorPuedeCambiarEstado ? (
                          <Button
                            type={accionTrabajadorPrincipal === 'finalizar' ? 'primary' : 'default'}
                            onClick={() => abrirAccion('finalizar')}
                          >
                            Finalizar
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </Space>
                }
              >
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="Correlativo">
                    {consulta.data?.correlativo ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="ID tecnico interno">
                    {consulta.data?.id}
                  </Descriptions.Item>
                  {consulta.data?.numeroSolicitud ? (
                    <Descriptions.Item label="Referencia externa">
                      {consulta.data.numeroSolicitud}
                    </Descriptions.Item>
                  ) : null}
                  <Descriptions.Item label="Prioridad">
                    {consulta.data?.prioridad ? (
                      <TagPrioridad prioridad={consulta.data.prioridad} />
                    ) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Responsable actual">
                    {consulta.data?.asignadoA
                      ? `${consulta.data.asignadoA.nombres} ${consulta.data.asignadoA.apellidos}`
                      : 'Sin responsable asignado (registro heredado)'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Canal de ingreso">
                    {consulta.data?.canalIngreso === 'PRESENCIAL'
                      ? 'Presencial'
                      : consulta.data?.canalIngreso === 'CORREO'
                        ? 'Correo'
                        : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tipo de solicitud">
                    {consulta.data?.tipoSolicitud.nombre}
                  </Descriptions.Item>
                  <Descriptions.Item label="Titulo">
                    {consulta.data?.titulo}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estado">
                    <Space wrap>
                      <TagEstadoSolicitud
                        estado={consulta.data?.estadoActual ?? 'INGRESADA'}
                        estaVencida={consulta.data?.estaVencida}
                      />
                      <TagVencimientoSolicitud
                        fechaVencimiento={consulta.data?.fechaVencimiento}
                        fechaCierre={consulta.data?.fechaCierre}
                        estaVencida={consulta.data?.estaVencida}
                      />
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha de creacion">
                    {formatearFechaHora(consulta.data?.creadoEn)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ultima actualizacion">
                    {formatearFechaHora(consulta.data?.actualizadoEn)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha de vencimiento">
                    <Space>
                      <span>{formatearFecha(consulta.data?.fechaVencimiento)}</span>
                      <TagVencimientoSolicitud
                        fechaVencimiento={consulta.data?.fechaVencimiento}
                        fechaCierre={consulta.data?.fechaCierre}
                        estaVencida={consulta.data?.estaVencida}
                      />
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha de cierre">
                    {consulta.data?.fechaCierre
                      ? formatearFechaHora(consulta.data.fechaCierre)
                      : 'Pendiente'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} xl={9}>
              <Space direction="vertical" size={16} className="w-full">
                <Card className="rounded-3xl" title="Descripcion">
                  <Typography.Paragraph className="!mb-0 max-h-[220px] overflow-y-auto pr-1">
                    {consulta.data?.descripcion}
                  </Typography.Paragraph>
                </Card>
                <Card
                  className="rounded-3xl"
                  title="Adjuntos"
                  extra={
                    <Upload
                      accept={EXTENSIONES_ADJUNTOS_PERMITIDAS.join(',')}
                      showUploadList={false}
                      beforeUpload={validarAdjuntoAntesDeSubir}
                    >
                      <Button loading={subiendo}>Subir adjunto</Button>
                    </Upload>
                  }
                >
                  <Typography.Paragraph className="!mb-4 !text-sm !text-black/65">
                    Formatos permitidos: PDF, DOC, DOCX, JPG y PNG. Tamano maximo:
                    10 MB.
                  </Typography.Paragraph>
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
                        <List.Item className="!items-start">
                          <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <List.Item.Meta
                              className="!m-0 min-w-0 flex-1"
                              title={
                                <Typography.Text className="!block !whitespace-normal !break-words !text-black">
                                  {adjunto.nombreOriginal}
                                </Typography.Text>
                              }
                              description={
                                <Typography.Text className="!text-black/60">
                                  {Math.round(adjunto.tamano / 1024)} KB
                                </Typography.Text>
                              }
                            />
                            <Space
                              size={8}
                              wrap
                              className="w-full md:w-auto md:justify-end"
                            >
                              <Button
                                size="small"
                                icon={<Icono nombre="ver" />}
                                className="!rounded-full !border-municipal-200 !bg-municipal-50 !px-3 !text-municipal-800 hover:!border-municipal-300 hover:!bg-white hover:!text-municipal-900"
                                onClick={() => void verAdjunto(adjunto.id)}
                              >
                                Ver
                              </Button>
                              <Button
                                size="small"
                                icon={<Icono nombre="descargar" />}
                                className="!rounded-full !border-municipal-200 !bg-white !px-3 !text-municipal-700 hover:!border-municipal-300 hover:!bg-municipal-50 hover:!text-municipal-900"
                                onClick={() => void descargarAdjunto(adjunto.id)}
                              >
                                Descargar
                              </Button>
                              <Popconfirm
                                title="Eliminar adjunto"
                                description="Esta accion no se puede deshacer."
                                okText="Eliminar"
                                cancelText="Cancelar"
                                onConfirm={() => void eliminarAdjunto(adjunto.id)}
                              >
                                <Button
                                  key="eliminar"
                                  size="small"
                                  danger
                                  className="!rounded-full !px-3"
                                >
                                  Eliminar
                                </Button>
                              </Popconfirm>
                            </Space>
                          </div>
                        </List.Item>
                      )}
                    />
                  </EstadoConsulta>
                </Card>
                <Card className="rounded-3xl" title="Historial operativo">
                  <Space
                    direction="vertical"
                    className="max-h-[520px] w-full overflow-y-auto pr-1"
                  >
                    {historialCompleto.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-municipal-100 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Typography.Text strong>{item.accion}</Typography.Text>
                          <Typography.Text className="!text-xs !text-black/55">
                            {formatearFechaHora(item.creadoEn)}
                          </Typography.Text>
                        </div>
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
      </Space>

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
          trabajadoresArea={trabajadoresArea}
          trabajadoresDerivables={trabajadoresDerivables}
          loadingUsuarios={usuarios.loading}
          esGestion={puedeGestionar}
          onFinish={(values) => void ejecutarAccion(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
