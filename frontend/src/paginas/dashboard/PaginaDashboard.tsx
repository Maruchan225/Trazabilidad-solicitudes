import { Alert, Card, Col, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { GraficoBarrasEstado } from '@/componentes/reportes/GraficoBarrasEstado';
import { GraficoBarrasSimple } from '@/componentes/reportes/GraficoBarrasSimple';
import { GraficoTortaSimple } from '@/componentes/reportes/GraficoTortaSimple';
import { TarjetaTablaReporte } from '@/componentes/reportes/TarjetaTablaReporte';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagCantidad } from '@/componentes/ui/tags/TagCantidad';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { reportesService } from '@/servicios/reportes/reportes.service';
import type {
  CargaPorTrabajador,
  DashboardTrabajador,
  SolicitudVencidaReporte,
  SolicitudesPorPrioridad,
} from '@/tipos/reportes';
import {
  COLOR_SEMAFORO_AMARILLO,
  COLOR_SEMAFORO_ROJO,
  COLOR_SEMAFORO_VERDE,
} from '@/utilidades/estadoVisual';
import { formatearDias, formatearEstado, obtenerTopPorCantidad } from '@/utilidades/reportes';

type TarjetaOperativa = {
  titulo: string;
  valor: number | string;
  color: string;
  apoyo?: string;
};

function PanelTarjetasOperativas({
  tarjetas,
}: {
  tarjetas: TarjetaOperativa[];
}) {
  return (
    <Row gutter={[16, 16]}>
      {tarjetas.map((tarjeta) => (
        <Col key={tarjeta.titulo} xs={24} sm={12} xl={8}>
          <Card className="rounded-3xl h-full border border-slate-200">
            <Space direction="vertical" size={8} className="w-full">
              <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-[0.18em] !text-black/45">
                {tarjeta.titulo}
              </Typography.Text>
              <TagCantidad valor={tarjeta.valor} color={tarjeta.color} />
              {tarjeta.apoyo ? (
                <Typography.Text className="!text-sm !text-black/60">
                  {tarjeta.apoyo}
                </Typography.Text>
              ) : null}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function DashboardTrabajadorVista() {
  const dashboard = useConsulta(
    () => reportesService.obtenerDashboardTrabajador(),
    [],
  );

  if (dashboard.loading) {
    return (
      <PaginaModulo
        titulo="Panel del trabajador"
        descripcion="Seguimiento diario de tus solicitudes activas en DOM."
      >
        <div className="flex min-h-[320px] items-center justify-center">
          <Typography.Text>Cargando resumen operativo...</Typography.Text>
        </div>
      </PaginaModulo>
    );
  }

  if (dashboard.error) {
    return (
      <PaginaModulo
        titulo="Panel del trabajador"
        descripcion="Seguimiento diario de tus solicitudes activas en DOM."
      >
        <Alert type="error" message={dashboard.error} showIcon />
      </PaginaModulo>
    );
  }

  const data = dashboard.data as DashboardTrabajador | undefined;
  const hayVencidas = (data?.solicitudesVencidas ?? 0) > 0;
  const hayPorVencer = (data?.solicitudesPorVencer ?? 0) > 0;
  const tarjetas: TarjetaOperativa[] = [
    {
      titulo: 'Vencidas',
      valor: data?.solicitudesVencidas ?? 0,
      color: COLOR_SEMAFORO_ROJO,
      apoyo: 'Necesitan atencion prioritaria.',
    },
    {
      titulo: 'Nuevas a cargo',
      valor: data?.solicitudesNuevas ?? 0,
      color: COLOR_SEMAFORO_AMARILLO,
      apoyo: 'Solicitudes recientemente ingresadas o derivadas.',
    },
    {
      titulo: 'En proceso',
      valor: data?.solicitudesEnProceso ?? 0,
      color: COLOR_SEMAFORO_AMARILLO,
      apoyo: 'Expedientes actualmente en gestion tecnica.',
    },
    {
      titulo: 'Cerradas',
      valor: data?.solicitudesCerradas ?? 0,
      color: COLOR_SEMAFORO_VERDE,
      apoyo: 'Solicitudes ya cerradas por coordinacion.',
    },
    {
      titulo: 'Por vencer',
      valor: data?.solicitudesPorVencer ?? 0,
      color: COLOR_SEMAFORO_AMARILLO,
      apoyo: 'Requieren seguimiento dentro de los proximos 3 dias.',
    },
    {
      titulo: 'Total a cargo',
      valor: data?.solicitudesACargo ?? 0,
      color: COLOR_SEMAFORO_VERDE,
      apoyo: 'Solicitudes abiertas actualmente asignadas.',
    },
  ];

  return (
    <PaginaModulo
      titulo="Panel del trabajador"
      descripcion="Resumen operativo personal para trabajar prioridades, vencimientos y cierre diario en DOM."
    >
      <Space direction="vertical" size={16} className="w-full">
        {hayVencidas ? (
          <Alert
            type="error"
            showIcon
            message="Tienes solicitudes vencidas que requieren atencion inmediata."
          />
        ) : hayPorVencer ? (
          <Alert
            type="warning"
            showIcon
            message="Tienes solicitudes por vencer en los proximos 3 dias."
          />
        ) : (
          <Alert
            type="success"
            showIcon
            message="No tienes solicitudes vencidas ni proximas a vencer."
          />
        )}
        <PanelTarjetasOperativas tarjetas={tarjetas} />
      </Space>
    </PaginaModulo>
  );
}

function DashboardGestionVista() {
  const resumen = useConsulta(() => reportesService.obtenerResumenGeneral(), []);
  const porEstado = useConsulta(
    () => reportesService.obtenerSolicitudesPorEstado(),
    [],
  );
  const porPrioridad = useConsulta(
    () => reportesService.obtenerSolicitudesPorPrioridad(),
    [],
  );
  const porTipo = useConsulta(() => reportesService.obtenerSolicitudesPorTipo(), []);
  const cargaTrabajador = useConsulta(
    () => reportesService.obtenerCargaPorTrabajador(),
    [],
  );
  const vencidas = useConsulta(
    () => reportesService.obtenerSolicitudesVencidas(),
    [],
  );

  const loading =
    resumen.loading ||
    porEstado.loading ||
    porPrioridad.loading ||
    porTipo.loading ||
    cargaTrabajador.loading ||
    vencidas.loading;

  const error =
    resumen.error ??
    porEstado.error ??
    porPrioridad.error ??
    porTipo.error ??
    cargaTrabajador.error ??
    vencidas.error;

  const estadosFormateados = (porEstado.data?.items ?? []).map((item) => ({
    ...item,
    estado: formatearEstado(item.estado),
  }));
  const trabajadoresConCarga = obtenerTopPorCantidad(
    cargaTrabajador.data ?? [],
    (item) => item.totalAsignadas,
    8,
  );
  const prioridades = (porPrioridad.data ?? []).filter((item) => item.cantidad > 0);
  const tiposTop = obtenerTopPorCantidad(
    porTipo.data ?? [],
    (item) => item.cantidad,
    6,
  );
  const topVencidas = (vencidas.data ?? []).slice(0, 8);
  const hayVencidas = (resumen.data?.solicitudesVencidas ?? 0) > 0;
  const hayPorVencer = (resumen.data?.solicitudesProximasAVencer ?? 0) > 0;

  if (loading) {
    return (
      <PaginaModulo
        titulo="Panel de coordinacion"
        descripcion="Vista operativa general de DOM para coordinacion y seguimiento."
      >
        <div className="flex min-h-[320px] items-center justify-center">
          <Typography.Text>Cargando panel operativo...</Typography.Text>
        </div>
      </PaginaModulo>
    );
  }

  if (error) {
    return (
      <PaginaModulo
        titulo="Panel de coordinacion"
        descripcion="Vista operativa general de DOM para coordinacion y seguimiento."
      >
        <Alert type="error" message={error} showIcon />
      </PaginaModulo>
    );
  }

  const tarjetas: TarjetaOperativa[] = [
    {
      titulo: 'Vencidas',
      valor: resumen.data?.solicitudesVencidas ?? 0,
      color: COLOR_SEMAFORO_ROJO,
      apoyo: 'Riesgo operativo que necesita priorizacion.',
    },
    {
      titulo: 'Nuevas',
      valor: resumen.data?.solicitudesIngresadas ?? 0,
      color: COLOR_SEMAFORO_AMARILLO,
      apoyo: 'Solicitudes recien ingresadas al flujo operativo.',
    },
    {
      titulo: 'En proceso',
      valor: resumen.data?.solicitudesEnProceso ?? 0,
      color: COLOR_SEMAFORO_AMARILLO,
      apoyo: 'Casos activos en gestion tecnica.',
    },
    {
      titulo: 'Finalizadas',
      valor: resumen.data?.solicitudesFinalizadas ?? 0,
      color: COLOR_SEMAFORO_VERDE,
      apoyo: 'Pendientes de cierre administrativo.',
    },
    {
      titulo: 'Cerradas',
      valor: resumen.data?.solicitudesCerradas ?? 0,
      color: COLOR_SEMAFORO_VERDE,
      apoyo: 'Solicitudes completamente cerradas.',
    },
    {
      titulo: 'Por vencer',
      valor: resumen.data?.solicitudesProximasAVencer ?? 0,
      color: COLOR_SEMAFORO_AMARILLO,
      apoyo: 'Requieren seguimiento en el corto plazo.',
    },
  ];

  return (
    <PaginaModulo
      titulo="Panel de coordinacion"
      descripcion="Operacion general de DOM con foco en estados, vencimientos, carga por usuario y tipos mas frecuentes."
    >
      <Space direction="vertical" size={24} className="w-full">
        {hayVencidas ? (
          <Alert
            type="error"
            showIcon
            message="Existen solicitudes vencidas que requieren coordinacion inmediata."
          />
        ) : hayPorVencer ? (
          <Alert
            type="warning"
            showIcon
            message="Hay solicitudes por vencer que conviene reasignar o acelerar."
          />
        ) : (
          <Alert
            type="success"
            showIcon
            message="La operacion actual se encuentra sin atrasos criticos."
          />
        )}
        <PanelTarjetasOperativas tarjetas={tarjetas} />

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={10}>
            <Card title="Estado operativo" className="rounded-3xl h-full">
              <GraficoBarrasEstado datos={estadosFormateados} />
            </Card>
          </Col>

          <Col xs={24} xl={7}>
            <Card title="Prioridades activas" className="rounded-3xl h-full">
              <GraficoBarrasSimple
                datos={prioridades.map((item: SolicitudesPorPrioridad) => ({
                  nombre: item.prioridad,
                  cantidad: item.cantidad,
                }))}
              />
            </Card>
          </Col>

          <Col xs={24} xl={7}>
            <Card title="Tipos mas frecuentes" className="rounded-3xl h-full">
              <GraficoTortaSimple
                datos={tiposTop.map((item) => ({
                  nombre: item.tipoSolicitud,
                  cantidad: item.cantidad,
                }))}
              />
            </Card>
          </Col>

          <Col xs={24} xl={14}>
            <TarjetaTablaReporte<CargaPorTrabajador>
              titulo="Carga por usuario"
              className="rounded-3xl h-full"
              consulta={{ ...cargaTrabajador, data: trabajadoresConCarga }}
              rowKey="trabajadorId"
              pagination={false}
              size="small"
              emptyDescription="No hay usuarios con solicitudes asignadas."
              locale={{ emptyText: 'No hay usuarios con solicitudes asignadas.' }}
              columns={[
                {
                  title: 'Usuario',
                  dataIndex: 'nombreCompleto',
                },
                {
                  title: 'Asignadas',
                  dataIndex: 'totalAsignadas',
                  sorter: (a, b) => a.totalAsignadas - b.totalAsignadas,
                },
                {
                  title: 'En proceso',
                  dataIndex: 'enProceso',
                  sorter: (a, b) => a.enProceso - b.enProceso,
                },
                {
                  title: 'Vencidas',
                  dataIndex: 'vencidas',
                  render: (valor: number) => (
                    <TagCantidad
                      valor={valor}
                      color={valor > 0 ? COLOR_SEMAFORO_ROJO : COLOR_SEMAFORO_VERDE}
                    />
                  ),
                },
              ]}
            />
          </Col>

          <Col xs={24} xl={10}>
            <Card title="Semaforo operativo" className="rounded-3xl h-full">
              <Space direction="vertical" size={14} className="w-full">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <Typography.Text strong className="!text-emerald-800">
                    Verde
                  </Typography.Text>
                  <Typography.Paragraph className="!mb-0 !mt-2 !text-emerald-900">
                    Solicitudes en plazo, finalizadas o cerradas correctamente.
                  </Typography.Paragraph>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Typography.Text strong className="!text-amber-800">
                    Amarillo
                  </Typography.Text>
                  <Typography.Paragraph className="!mb-0 !mt-2 !text-amber-900">
                    Solicitudes nuevas, en proceso o proximas a vencer.
                  </Typography.Paragraph>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <Typography.Text strong className="!text-rose-800">
                    Rojo
                  </Typography.Text>
                  <Typography.Paragraph className="!mb-0 !mt-2 !text-rose-900">
                    Solicitudes vencidas o con atraso operativo.
                  </Typography.Paragraph>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24}>
            <TarjetaTablaReporte<SolicitudVencidaReporte>
              titulo="Solicitudes vencidas prioritarias"
              consulta={{ ...vencidas, data: topVencidas }}
              rowKey="id"
              pagination={false}
              emptyDescription="No hay solicitudes vencidas."
              locale={{ emptyText: 'No hay solicitudes vencidas.' }}
              columns={[
                {
                  title: 'Correlativo',
                  render: (_, record) => record.correlativo ?? '-',
                  width: 100,
                },
                {
                  title: 'Solicitud',
                  dataIndex: 'titulo',
                  render: (_, record) => (
                    <Link to={`/solicitudes/${record.id}`}>{record.titulo}</Link>
                  ),
                },
                {
                  title: 'Tipo',
                  dataIndex: 'tipoSolicitud',
                },
                {
                  title: 'Responsable',
                  render: (_, record) =>
                    record.asignadoA ?? 'Sin responsable asignado (registro heredado)',
                },
                {
                  title: 'Atraso',
                  dataIndex: 'diasAtraso',
                  render: (valor: number) => (
                    <TagCantidad valor={formatearDias(valor)} color={COLOR_SEMAFORO_ROJO} />
                  ),
                },
              ]}
            />
          </Col>
        </Row>
      </Space>
    </PaginaModulo>
  );
}

export function PaginaDashboard() {
  const { sesion } = useAutenticacion();

  if (sesion?.usuario.rol === 'TRABAJADOR') {
    return <DashboardTrabajadorVista />;
  }

  return <DashboardGestionVista />;
}
