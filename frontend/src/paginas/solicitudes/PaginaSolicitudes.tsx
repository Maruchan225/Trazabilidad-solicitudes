import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FormularioSolicitud } from '@/componentes/solicitudes/FormularioSolicitud';
import { Icono } from '@/componentes/ui/Icono';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { TagPrioridad } from '@/componentes/ui/tags/TagPrioridad';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { useValorDebounceado } from '@/ganchos/useValorDebounceado';
import { areasService } from '@/servicios/areas/areas.service';
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
  mapearOpcionesAreas,
  mapearOpcionesTiposSolicitud,
} from '@/utilidades/opciones';
import { puedeCrearSolicitudes } from '@/utilidades/permisos';

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
  areaId?: number;
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

  if (params.areaId) {
    searchParams.set('areaId', String(params.areaId));
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
    areaFiltro: parsearNumeroParam(searchParams.get('areaId')),
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
  const [areaFiltro, setAreaFiltro] = useState<number | undefined>(
    filtrosIniciales.areaFiltro,
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
        areaId: areaFiltro,
        tipoSolicitudId: tipoFiltro,
        prioridad: prioridadFiltro,
      }),
    [busquedaAplicada, estadoFiltro, areaFiltro, tipoFiltro, prioridadFiltro],
  );
  const areas = useConsulta(() => areasService.listar(), []);
  const tiposSolicitud = useConsulta(() => tiposSolicitudService.listar(), []);
  const usuarios = useConsulta(() => usuariosService.listar(), []);
  const [form] = Form.useForm<SolicitudPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const { loading: guardando, ejecutar } = useMutacion();
  const solicitudes = consulta.data ?? [];
  const areasActivas = (areas.data ?? []).filter((area) => area.activo);
  const tiposActivos = (tiposSolicitud.data ?? []).filter((tipo) => tipo.activo);
  const areaSeleccionada = Form.useWatch('areaActualId', form);
  const puedeCrear = puedeCrearSolicitudes(sesion?.usuario.rol);
  const trabajadoresDisponibles = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      (!areaSeleccionada || usuario.area.id === areaSeleccionada),
  );
  const filtrosArea = mapearOpcionesAreas(areasActivas);
  const filtrosTipoSolicitud = mapearOpcionesTiposSolicitud(tiposActivos);
  const hayFiltrosAplicados =
    busquedaAplicada.length > 0 ||
    estadoFiltro !== undefined ||
    areaFiltro !== undefined ||
    tipoFiltro !== undefined ||
    prioridadFiltro !== undefined;
  const mensajeSinResultados = hayFiltrosAplicados
    ? 'No se encontraron solicitudes con los filtros aplicados.'
    : 'No hay solicitudes registradas.';
  const filtrosActuales = construirParametrosFiltros({
    busqueda: busquedaAplicada,
    estado: estadoFiltro,
    areaId: areaFiltro,
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
    setAreaFiltro(filtrosExternos.areaFiltro);
    setTipoFiltro(filtrosExternos.tipoFiltro);
    setPrioridadFiltro(filtrosExternos.prioridadFiltro);
    ultimaQuerySincronizadaRef.current = queryActual;
  }, [queryActual, searchParams, sincronizarBusquedaAplicada]);

  useEffect(() => {
    const parametrosEsperados = construirParametrosFiltros({
      busqueda: busquedaAplicada,
      estado: estadoFiltro,
      areaId: areaFiltro,
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
    areaFiltro,
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
    form.setFieldsValue({ prioridad: 'MEDIA' });
    setModalAbierto(true);
  }

  async function guardar(values: SolicitudPayload) {
    const comentario = values.comentario?.trim();
    const payload: SolicitudPayload = {
      ...values,
      titulo: normalizarTextoRequerido(values.titulo),
      descripcion: normalizarTextoRequerido(values.descripcion),
      fechaVencimiento: new Date(values.fechaVencimiento).toISOString(),
      asignadoAId: values.asignadoAId ?? undefined,
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
      descripcion="Listado de solicitudes ingresadas al sistema."
    >
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
            placeholder="Buscar por ID, titulo, descripcion, area, tipo o asignado"
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
            className="min-w-44"
            placeholder="Filtrar area"
            value={areaFiltro}
            options={filtrosArea}
            onChange={(valor) => {
              aplicarBusquedaPendiente();
              setAreaFiltro(valor);
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
              setAreaFiltro(undefined);
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
                title: 'ID',
                dataIndex: 'id',
                sorter: (a, b) => a.id - b.id,
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
                defaultSortOrder: 'descend',
                sorter: (a, b) => compararFechas(a.creadoEn, b.creadoEn),
                render: (creadoEn: string) => formatearFechaHora(creadoEn),
              },
              {
                title: 'Estado',
                dataIndex: 'estadoActual',
                render: (estado: string, record) => (
                  <Space>
                    <TagEstadoSolicitud
                      estado={record.estadoActual}
                      estaVencida={record.estaVencida}
                    />
                    {record.estaVencida && estado !== 'VENCIDA' ? (
                      <Tag color="#111827">Vencida</Tag>
                    ) : null}
                  </Space>
                ),
              },
              {
                title: 'Fecha de vencimiento',
                dataIndex: 'fechaVencimiento',
                sorter: (a, b) =>
                  compararFechas(a.fechaVencimiento, b.fechaVencimiento),
                render: (fechaVencimiento: string) =>
                  formatearFechaHora(fechaVencimiento),
              },
              {
                title: 'Area',
                sorter: (a, b) =>
                  a.areaActual.nombre.localeCompare(b.areaActual.nombre),
                render: (_, record) => record.areaActual.nombre,
              },
              {
                title: 'Tipo',
                sorter: (a, b) =>
                  a.tipoSolicitud.nombre.localeCompare(b.tipoSolicitud.nombre),
                render: (_, record) => record.tipoSolicitud.nombre,
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
          areas={areasActivas}
          tiposSolicitud={tiposActivos}
          trabajadoresDisponibles={trabajadoresDisponibles}
          loadingAreas={areas.loading}
          loadingTipos={tiposSolicitud.loading}
          loadingUsuarios={usuarios.loading}
          areaSeleccionada={areaSeleccionada}
          onFinish={(values) => void guardar(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
