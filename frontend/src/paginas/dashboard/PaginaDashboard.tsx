import { Alert, Card, Col, Progress, Row, Space, Table, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { TarjetaListaCantidad } from '@/componentes/reportes/TarjetaListaCantidad';
import { TarjetaTablaReporte } from '@/componentes/reportes/TarjetaTablaReporte';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagCantidad } from '@/componentes/ui/tags/TagCantidad';
import { useConsulta } from '@/ganchos/useConsulta';
import { reportesService } from '@/servicios/reportes/reportes.service';
import type {
  CargaPorTrabajador,
  SolicitudVencidaReporte,
  SolicitudesPorArea,
  SolicitudesPorTipo,
} from '@/tipos/reportes';
import {
  crearTarjetasResumenReportes,
  formatearDias,
  obtenerTopPorCantidad,
} from '@/utilidades/reportes';

export function PaginaDashboard() {
  const resumen = useConsulta(() => reportesService.obtenerResumenGeneral(), []);
  const porEstado = useConsulta(
    () => reportesService.obtenerSolicitudesPorEstado(),
    [],
  );
  const porArea = useConsulta(() => reportesService.obtenerSolicitudesPorArea(), []);
  const porTipo = useConsulta(() => reportesService.obtenerSolicitudesPorTipo(), []);
  const cargaTrabajador = useConsulta(
    () => reportesService.obtenerCargaPorTrabajador(),
    [],
  );
  const tiempoPromedio = useConsulta(
    () => reportesService.obtenerTiempoPromedioRespuesta(),
    [],
  );
  const vencidas = useConsulta(
    () => reportesService.obtenerSolicitudesVencidas(),
    [],
  );

  const loading =
    resumen.loading ||
    porEstado.loading ||
    porArea.loading ||
    porTipo.loading ||
    cargaTrabajador.loading ||
    tiempoPromedio.loading ||
    vencidas.loading;

  const error =
    resumen.error ??
    porEstado.error ??
    porArea.error ??
    porTipo.error ??
    cargaTrabajador.error ??
    tiempoPromedio.error ??
    vencidas.error;

  const areasTop = obtenerTopPorCantidad(porArea.data ?? [], (item) => item.cantidad, 5);
  const tiposTop = obtenerTopPorCantidad(porTipo.data ?? [], (item) => item.cantidad, 5);
  const trabajadoresConCarga = obtenerTopPorCantidad(
    cargaTrabajador.data ?? [],
    (item) => item.totalAsignadas,
    6,
  );
  const topVencidas = (vencidas.data ?? []).slice(0, 6);
  const totalSolicitudes = resumen.data?.totalSolicitudes ?? 0;

  if (loading) {
    return (
      <PaginaModulo
        titulo="Dashboard"
        descripcion="Resumen general del estado de las solicitudes en el sistema."
      >
        <div className="flex min-h-[320px] items-center justify-center">
          <Typography.Text>Cargando metricas del dashboard...</Typography.Text>
        </div>
      </PaginaModulo>
    );
  }

  if (error) {
    return (
      <PaginaModulo
        titulo="Dashboard"
        descripcion="Resumen general del estado de las solicitudes en el sistema."
      >
        <Alert type="error" message={error} showIcon />
      </PaginaModulo>
    );
  }

  return (
    <PaginaModulo
      titulo="Dashboard"
      descripcion="Panel operativo con metricas reales, carga por trabajador y alertas clave para el seguimiento diario."
      tarjetas={[
        ...crearTarjetasResumenReportes(resumen.data, tiempoPromedio.data),
        {
          titulo: 'Vencidas',
          valor: resumen.data?.solicitudesVencidas ?? 0,
        },
      ]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="Estado de solicitudes" className="rounded-3xl h-full">
            <Space direction="vertical" size={14} className="w-full">
              {(porEstado.data?.items ?? []).map((item) => {
                const porcentaje =
                  totalSolicitudes > 0
                    ? Math.round((item.cantidad / totalSolicitudes) * 100)
                    : 0;

                return (
                  <div key={item.estado}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Typography.Text strong>{item.estado}</Typography.Text>
                      <Typography.Text>{item.cantidad}</Typography.Text>
                    </div>
                    <Progress percent={porcentaje} showInfo={false} strokeColor="#4b5563" />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <TarjetaTablaReporte<CargaPorTrabajador>
            titulo="Carga por trabajador"
            className="rounded-3xl h-full"
            consulta={{ ...cargaTrabajador, data: trabajadoresConCarga }}
            rowKey="trabajadorId"
            pagination={false}
            size="small"
            emptyDescription="No hay trabajadores con solicitudes asignadas."
            locale={{ emptyText: 'No hay trabajadores con solicitudes asignadas.' }}
            columns={[
              {
                title: 'Trabajador',
                dataIndex: 'nombreCompleto',
              },
              {
                title: 'Area',
                dataIndex: 'area',
              },
              {
                title: 'Asignadas',
                dataIndex: 'totalAsignadas',
                sorter: (a, b) => a.totalAsignadas - b.totalAsignadas,
              },
              {
                title: 'Vencidas',
                dataIndex: 'vencidas',
                render: (valor: number) => (
                  <TagCantidad valor={valor} color={valor > 0 ? '#111827' : 'default'} />
                ),
              },
            ]}
          />
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Alertas del dia" className="rounded-3xl h-full">
            <Space direction="vertical" size={12} className="w-full">
              <div className="rounded-2xl bg-arena p-4">
                <Typography.Text strong>Solicitudes proximas a vencer</Typography.Text>
                <div className="mt-2">
                  <TagCantidad
                    valor={`${resumen.data?.solicitudesProximasAVencer ?? 0} en seguimiento`}
                    color="#6b7280"
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-municipal-50 p-4">
                <Typography.Text strong>Solicitudes cerradas</Typography.Text>
                <div className="mt-2">
                  <TagCantidad
                    valor={`${resumen.data?.solicitudesCerradas ?? 0} resueltas`}
                    color="#4b5563"
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-municipal-100">
                <Typography.Text strong>Tiempo promedio de cierre</Typography.Text>
                <div className="mt-2">
                  <TagCantidad
                    valor={`${tiempoPromedio.data?.tiempoPromedioDias ?? 0} dias`}
                    color="#6b7280"
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <TarjetaListaCantidad<SolicitudesPorArea>
            titulo="Areas con mas solicitudes"
            items={areasTop}
            emptyText="No hay datos por area."
            obtenerClave={(item) => item.areaId}
            obtenerTitulo={(item) => item.area}
            obtenerCantidad={(item) => item.cantidad}
          />
        </Col>

        <Col xs={24} xl={8}>
          <TarjetaListaCantidad<SolicitudesPorTipo>
            titulo="Tipos mas frecuentes"
            items={tiposTop}
            emptyText="No hay datos por tipo."
            obtenerClave={(item) => item.tipoSolicitudId}
            obtenerTitulo={(item) => item.tipoSolicitud}
            obtenerCantidad={(item) => item.cantidad}
          />
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Tiempo de respuesta" className="rounded-3xl h-full">
            <Space direction="vertical" size={12} className="w-full">
              <div className="rounded-2xl border border-municipal-100 p-4">
                <Typography.Text strong>Solicitudes cerradas analizadas</Typography.Text>
                <Typography.Title level={3} className="!mb-0 !mt-2 !text-black">
                  {tiempoPromedio.data?.totalSolicitudesCerradas ?? 0}
                </Typography.Title>
              </div>
              <div className="rounded-2xl border border-municipal-100 p-4">
                <Typography.Text strong>Promedio en horas</Typography.Text>
                <Typography.Title level={3} className="!mb-0 !mt-2 !text-black">
                  {tiempoPromedio.data?.tiempoPromedioHoras ?? 0}
                </Typography.Title>
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
                title: 'ID',
                dataIndex: 'id',
                width: 80,
              },
              {
                title: 'Titulo',
                dataIndex: 'titulo',
                render: (_, record) => (
                  <Link to={`/solicitudes/${record.id}`}>{record.titulo}</Link>
                ),
              },
              {
                title: 'Area',
                dataIndex: 'area',
              },
              {
                title: 'Asignado a',
                render: (_, record) => record.asignadoA ?? 'Sin asignacion',
              },
              {
                title: 'Atraso',
                dataIndex: 'diasAtraso',
                render: (valor: number) => (
                  <TagCantidad valor={formatearDias(valor)} color="#111827" />
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </PaginaModulo>
  );
}
