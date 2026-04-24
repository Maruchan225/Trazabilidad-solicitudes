import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FormularioSolicitud } from '@/componentes/solicitudes/FormularioSolicitud';
import { Icono } from '@/componentes/ui/Icono';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { TagPrioridad } from '@/componentes/ui/tags/TagPrioridad';
import { TagVencimientoSolicitud } from '@/componentes/ui/tags/TagVencimientoSolicitud';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { useValorDebounceado } from '@/ganchos/useValorDebounceado';
import { solicitudesService } from '@/servicios/solicitudes/solicitudes.service';
import { tiposSolicitudService } from '@/servicios/tipos-solicitud/tiposSolicitud.service';
import { usuariosService } from '@/servicios/usuarios/usuarios.service';
import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';
import type { Solicitud, SolicitudPayload } from '@/tipos/solicitudes';
import {
  normalizarTextoOpcional,
  normalizarTextoRequerido,
} from '@/utilidades/crud';
import { compararFechas, formatearFechaHora } from '@/utilidades/fechas';
import {
  OPCIONES_ESTADO_SOLICITUD,
  OPCIONES_FILTRO_PRIORIDAD_SOLICITUD,
  mapearOpcionesTiposSolicitud,
} from '@/utilidades/opciones';
import { puedeCrearSolicitudes } from '@/utilidades/permisos';
import {
  calcularDiasHastaVencimiento,
  ordenarSolicitudesPorUrgencia,
} from '@/utilidades/solicitudesOperativas';

const RETRASO_BUSQUEDA_MS = 300;
const ESTADOS_SOLICITUD_VALIDOS: EstadoSolicitud[] = [
  'INGRESADA',
  'DERIVADA',
  'EN_PROCESO',
  'PENDIENTE_INFORMACION',
  'FINALIZADA',
  'CERRADA',
  'VENCIDA',
];

const PRIORIDADES_SOLICITUD_VALIDAS: PrioridadSolicitud[] = [
  'BAJA',
  'MEDIA',
  'ALTA',
  'URGENTE',
];

function parsearNumeroParam(valor: string | null) {
  if (!valor) {
    return undefined;
  }

  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : undefined;
}

function parsearEstadoParam(valor: string | null) {
  return ESTADOS_SOLICITUD_VALIDOS.includes(valor as EstadoSolicitud)
    ? (valor as EstadoSolicitud)
    : undefined;
}

function parsearPrioridadParam(valor: string | null) {
  return PRIORIDADES_SOLICITUD_VALIDAS.includes(valor as PrioridadSolicitud)
    ? (valor as PrioridadSolicitud)
    : undefined;
}

function construirParametrosFiltros(params: {
  busqueda?: string;
  estado?: EstadoSolicitud;
  tipoSolicitudId?: number;
  prioridad?: PrioridadSolicitud;
}) {
  const searchParams = new URLSearchParams();
  const busquedaNormalizada = params.busqueda?.trim();

  if (busquedaNormalizada) {
    searchParams.set('busqueda', busquedaNormalizada);
  }

  if (params.estado) {
    searchParams.set('estado', params.estado);
  }

  if (params.tipoSolicitudId) {
    searchParams.set('tipoSolicitudId', String(params.tipoSolicitudId));
  }

  if (params.prioridad) {
    searchParams.set('prioridad', params.prioridad);
  }

  return searchParams;
}

function obtenerFiltrosDesdeQuery(searchParams: URLSearchParams) {
  return {
    busqueda: searchParams.get('busqueda') ?? '',
    estadoFiltro: parsearEstadoParam(searchParams.get('estado')),
    tipoFiltro: parsearNumeroParam(searchParams.get('tipoSolicitudId')),
    prioridadFiltro: parsearPrioridadParam(searchParams.get('prioridad')),
  };
}

export function PaginaSolicitudes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtrosIniciales = obtenerFiltrosDesdeQuery(searchParams);
  const queryActual = searchParams.toString();
  const ultimaQuerySincronizadaRef = useRef(queryActual);
  const { sesion } = useAutenticacion();
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSolicitud | undefined>(
    filtrosIniciales.estadoFiltro,
  );
  const [tipoFiltro, setTipoFiltro] = useState<number | undefined>(
    filtrosIniciales.tipoFiltro,
  );
  const [prioridadFiltro, setPrioridadFiltro] = useState<
    PrioridadSolicitud | undefined
  >(filtrosIniciales.prioridadFiltro);
  const [busqueda, setBusqueda] = useState(filtrosIniciales.busqueda);
  const {
    valorDebounceado: busquedaAplicada,
    sincronizarInmediatamente: sincronizarBusquedaAplicada,
  } = useValorDebounceado(
    busqueda.trim(),
    RETRASO_BUSQUEDA_MS,
  );
  const consulta = useConsulta(
    () =>
      solicitudesService.listar({
        busqueda: busquedaAplicada || undefined,
        estado: estadoFiltro,
        tipoSolicitudId: tipoFiltro,
        prioridad: prioridadFiltro,
      }),
    [busquedaAplicada, estadoFiltro, tipoFiltro, prioridadFiltro],
  );
  const tiposSolicitud = useConsulta(() => tiposSolicitudService.listar(), []);
  const usuarios = useConsulta(() => usuariosService.listar(), []);
  const [form] = Form.useForm<SolicitudPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const { loading: guardando, ejecutar } = useMutacion();
  const solicitudes = ordenarSolicitudesPorUrgencia(consulta.data ?? []);
  const tiposActivos = (tiposSolicitud.data ?? []).filter((tipo) => tipo.activo);
  const tiposDisponiblesParaCrear = tiposActivos.filter(
    (tipo) => typeof tipo.diasSla === 'number' && tipo.diasSla > 0,
  );
  const puedeCrear = puedeCrearSolicitudes(sesion?.usuario.rol);
  const trabajadoresDisponibles = (usuarios.data ?? []).filter(
    (usuario) => usuario.rol === 'TRABAJADOR' && usuario.activo,
  );
  const filtrosTipoSolicitud = mapearOpcionesTiposSolicitud(tiposActivos);
  const hayFiltrosAplicados =
    busquedaAplicada.length > 0 ||
    estadoFiltro !== undefined ||
    tipoFiltro !== undefined ||
    prioridadFiltro !== undefined;
  const mensajeSinResultados = hayFiltrosAplicados
    ? 'No se encontraron solicitudes con los filtros aplicados.'
    : 'No hay solicitudes registradas.';
  const solicitudesVencidas = solicitudes.filter((solicitud) => solicitud.estaVencida).length;
  const solicitudesPorVencer = solicitudes.filter((solicitud) => {
    const dias = calcularDiasHastaVencimiento(
      solicitud.fechaVencimiento,
      solicitud.fechaCierre,
    );

    return typeof dias === 'number' && dias >= 0 && dias <= 3;
  }).length;
  const filtrosActuales = construirParametrosFiltros({
    busqueda: busquedaAplicada,
    estado: estadoFiltro,
    tipoSolicitudId: tipoFiltro,
    prioridad: prioridadFiltro,
  });
  const retornoListado = `/solicitudes${filtrosActuales.toString() ? `?${filtrosActuales.toString()}` : ''}`;

  useEffect(() => {
    if (queryActual === ultimaQuerySincronizadaRef.current) {
      return;
    }

    const filtrosExternos = obtenerFiltrosDesdeQuery(searchParams);

    setBusqueda(filtrosExternos.busqueda);
    sincronizarBusquedaAplicada(filtrosExternos.busqueda.trim());
    setEstadoFiltro(filtrosExternos.estadoFiltro);
    setTipoFiltro(filtrosExternos.tipoFiltro);
    setPrioridadFiltro(filtrosExternos.prioridadFiltro);
    ultimaQuerySincronizadaRef.current = queryActual;
  }, [queryActual, searchParams, sincronizarBusquedaAplicada]);

  useEffect(() => {
    const parametrosEsperados = construirParametrosFiltros({
      busqueda: busquedaAplicada,
      estado: estadoFiltro,
      tipoSolicitudId: tipoFiltro,
      prioridad: prioridadFiltro,
    }).toString();

    if (queryActual === parametrosEsperados) {
      ultimaQuerySincronizadaRef.current = queryActual;
      return;
    }

    ultimaQuerySincronizadaRef.current = parametrosEsperados;
    setSearchParams(new URLSearchParams(parametrosEsperados), { replace: true });
  }, [
    busquedaAplicada,
    estadoFiltro,
    prioridadFiltro,
    queryActual,
    setSearchParams,
    tipoFiltro,
  ]);

  function aplicarBusquedaPendiente() {
    sincronizarBusquedaAplicada(busqueda.trim());
  }

  function cerrarModal() {
    setModalAbierto(false);
  }

  function abrirCrear() {
    form.resetFields();
    form.setFieldsValue({ prioridad: 'MEDIA', canalIngreso: 'PRESENCIAL' });
    setModalAbierto(true);
  }

  async function guardar(values: SolicitudPayload) {
    const comentario = values.comentario?.trim();
    const payload: SolicitudPayload = {
      ...values,
      titulo: normalizarTextoRequerido(values.titulo),
      descripcion: normalizarTextoRequerido(values.descripcion),
      asignadoAId: values.asignadoAId,
      comentario: normalizarTextoOpcional(comentario),
    };

    await ejecutar(() => solicitudesService.crear(payload), {
      mensajeExito: 'Solicitud creada con exito',
      mensajeError: 'No fue posible crear',
      onSuccess: async (solicitud) => {
        cerrarModal();
        await consulta.refetch();
        navigate(`/solicitudes/${solicitud.id}`, {
          state: { returnTo: retornoListado },
        });
      },
    });
  }

  return (
    <PaginaModulo
      titulo="Solicitudes"
      descripcion="Operacion diaria de solicitudes DOM con foco en responsable, prioridad, canal y vencimiento."
    >
      <Space direction="vertical" size={16} className="w-full">
        {solicitudesVencidas > 0 ? (
          <Alert
            type="error"
            showIcon
            message={`Hay ${solicitudesVencidas} solicitud(es) vencida(s) en el listado actual.`}
          />
        ) : solicitudesPorVencer > 0 ? (
          <Alert
            type="warning"
            showIcon
            message={`Hay ${solicitudesPorVencer} solicitud(es) por vencer en el listado actual.`}
          />
        ) : (
          <Alert
            type="success"
            showIcon
            message="No hay solicitudes vencidas ni proximas a vencer en el listado actual."
          />
        )}

        <Card
          className="rounded-3xl"
          extra={
            <Space>
              <Button onClick={() => void consulta.refetch()}>Actualizar</Button>
              {puedeCrear ? (
                <Button type="primary" icon={<Icono nombre="mas" />} onClick={abrirCrear}>
                  Nueva Solicitud
                </Button>
              ) : null}
            </Space>
          }
        >
          <Space wrap className="mb-4">
          <Input.Search
            allowClear
            className="min-w-64"
            placeholder="Buscar por correlativo, referencia externa, titulo, tipo o responsable"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
          <Select<EstadoSolicitud>
            allowClear
            className="min-w-40"
            placeholder="Filtrar estado"
            value={estadoFiltro}
            options={OPCIONES_ESTADO_SOLICITUD}
            onChange={(valor) => {
              aplicarBusquedaPendiente();
              setEstadoFiltro(valor);
            }}
          />
          <Select<number>
            allowClear
            className="min-w-48"
            placeholder="Filtrar tipo"
            value={tipoFiltro}
            options={filtrosTipoSolicitud}
            onChange={(valor) => {
              aplicarBusquedaPendiente();
              setTipoFiltro(valor);
            }}
          />
          <Select<PrioridadSolicitud>
            allowClear
            className="min-w-40"
            placeholder="Filtrar prioridad"
            value={prioridadFiltro}
            options={OPCIONES_FILTRO_PRIORIDAD_SOLICITUD}
            onChange={(valor) => {
              aplicarBusquedaPendiente();
              setPrioridadFiltro(valor);
            }}
          />
          <Button
            onClick={() => {
              setBusqueda('');
              sincronizarBusquedaAplicada('');
              setEstadoFiltro(undefined);
              setTipoFiltro(undefined);
              setPrioridadFiltro(undefined);
            }}
          >
            Limpiar filtros
          </Button>
          </Space>

          {consulta.error ? (
            <Alert type="error" message={consulta.error} showIcon />
          ) : (
            <Table<Solicitud>
              loading={consulta.loading}
              rowKey="id"
              dataSource={solicitudes}
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: mensajeSinResultados }}
              columns={[
              {
                title: 'Correlativo',
                dataIndex: 'correlativo',
                sorter: (a, b) => (a.correlativo ?? 0) - (b.correlativo ?? 0),
                render: (correlativo: number | null | undefined) =>
                  correlativo ?? '-',
              },
              {
                title: 'Titulo',
                dataIndex: 'titulo',
                sorter: (a, b) => a.titulo.localeCompare(b.titulo),
                render: (_, record) => (
                  <Link
                    to={`/solicitudes/${record.id}`}
                    state={{ returnTo: retornoListado }}
                  >
                    {record.titulo}
                  </Link>
                ),
              },
              {
                title: 'Fecha de creacion',
                dataIndex: 'creadoEn',
                sorter: (a, b) => compararFechas(a.creadoEn, b.creadoEn),
                render: (creadoEn: string) => formatearFechaHora(creadoEn),
              },
              {
                title: 'Estado',
                dataIndex: 'estadoActual',
                render: (_, record) => (
                  <Space>
                    <TagEstadoSolicitud
                      estado={record.estadoActual}
                      estaVencida={record.estaVencida}
                    />
                  </Space>
                ),
              },
              {
                title: 'Fecha de vencimiento',
                dataIndex: 'fechaVencimiento',
                sorter: (a, b) =>
                  compararFechas(a.fechaVencimiento, b.fechaVencimiento),
                render: (fechaVencimiento: string, record) =>
                  (
                    <Space direction="vertical" size={4}>
                      <span>{formatearFechaHora(fechaVencimiento)}</span>
                      <TagVencimientoSolicitud
                        fechaVencimiento={fechaVencimiento}
                        fechaCierre={record.fechaCierre}
                        estaVencida={record.estaVencida}
                      />
                    </Space>
                  ),
              },
              {
                title: 'Responsable',
                render: (_, record) =>
                  record.asignadoA
                    ? `${record.asignadoA.nombres} ${record.asignadoA.apellidos}`
                    : 'Sin responsable asignado (registro heredado)',
              },
              {
                title: 'Tipo',
                sorter: (a, b) =>
                  a.tipoSolicitud.nombre.localeCompare(b.tipoSolicitud.nombre),
                render: (_, record) => record.tipoSolicitud.nombre,
              },
              {
                title: 'Canal',
                dataIndex: 'canalIngreso',
                render: (canalIngreso: string | null | undefined) =>
                  canalIngreso === 'PRESENCIAL'
                    ? 'Presencial'
                    : canalIngreso === 'CORREO'
                      ? 'Correo'
                      : '-',
              },
              {
                title: 'Prioridad',
                dataIndex: 'prioridad',
                render: (prioridad: PrioridadSolicitud) => (
                  <TagPrioridad prioridad={prioridad} />
                ),
              },
              ]}
            />
          )}
        </Card>
      </Space>

      <Modal
        title="Nueva solicitud"
        open={modalAbierto}
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
      >
        <FormularioSolicitud
          form={form}
          tiposSolicitud={tiposDisponiblesParaCrear}
          trabajadoresDisponibles={trabajadoresDisponibles}
          loadingTipos={tiposSolicitud.loading}
          loadingUsuarios={usuarios.loading}
          onFinish={(values) => void guardar(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
