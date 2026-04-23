import { Alert, Card, Col, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { GraficoBarrasEstado } from '@/componentes/reportes/GraficoBarrasEstado';
import { GraficoBarrasSimple } from '@/componentes/reportes/GraficoBarrasSimple';
import { GraficoTortaSimple } from '@/componentes/reportes/GraficoTortaSimple';
import { TarjetaTablaReporte } from '@/componentes/reportes/TarjetaTablaReporte';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagCantidad } from '@/componentes/ui/tags/TagCantidad';
import { useConsulta } from '@/ganchos/useConsulta';
import { reportesService } from '@/servicios/reportes/reportes.service';
import type { CargaPorTrabajador, SolicitudVencidaReporte } from '@/tipos/reportes';
import {
  crearTarjetasResumenReportes,
  formatearDias,
  formatearEstado,
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

  if (loading) {
    return (
      <PaginaModulo
        titulo="Dashboard"
        descripcion="Resumen general del estado de las solicitudes en el sistema."
      >
        <div className="flex min-h-[320px] items-center justify-center">
          <Typography.Text>Cargando métricas del dashboard...</Typography.Text>
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

  const estadosFormateados = (porEstado.data?.items ?? []).map((item) => ({
    ...item,
    estado: formatearEstado(item.estado),
  }));

  return (
    <PaginaModulo
      titulo="Dashboard"
      descripcion="Panel operativo con métricas reales, carga por trabajador y alertas clave para el seguimiento diario."
      tarjetas={[
        ...crearTarjetasResumenReportes(resumen.data, tiempoPromedio.data),
        {
          titulo: 'Vencidas',
          valor: resumen.data?.solicitudesVencidas ?? 0,
        },
      ]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} xl={8}>
          <Card title="Estado de solicitudes" className="rounded-3xl h-full">
            <GraficoBarrasEstado datos={estadosFormateados} />
          </Card>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <Card title="Áreas con más solicitudes" className="rounded-3xl h-full">
            <GraficoBarrasSimple
              datos={areasTop.map((item) => ({
                nombre: item.area,
                cantidad: item.cantidad,
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12} xl={8}>
          <Card title="Tipos más frecuentes" className="rounded-3xl h-full">
            <GraficoTortaSimple
              datos={tiposTop.map((item) => ({
                nombre: item.tipoSolicitud,
                cantidad: item.cantidad,
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} xl={12}>
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
                title: 'Área',
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
                  <TagCantidad valor={valor} color={valor > 0 ? '#ef4444' : '#10b981'} />
                ),
              },
            ]}
          />
        </Col>

        <Col xs={24} lg={12} xl={6}>
          <Card title="Alertas del día" className="rounded-3xl h-full">
            <Space direction="vertical" size={12} className="w-full">
              <div className="rounded-2xl bg-arena p-4">
                <Typography.Text strong>Solicitudes próximas a vencer</Typography.Text>
                <div className="mt-2">
                  <TagCantidad
                    valor={`${resumen.data?.solicitudesProximasAVencer ?? 0} en seguimiento`}
                    color={resumen.data?.solicitudesProximasAVencer && resumen.data.solicitudesProximasAVencer > 0 ? '#f59e0b' : '#64748b'}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-municipal-50 p-4">
                <Typography.Text strong>Solicitudes cerradas</Typography.Text>
                <div className="mt-2">
                  <TagCantidad
                    valor={`${resumen.data?.solicitudesCerradas ?? 0} resueltas`}
                    color="#10b981"
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-municipal-100">
                <Typography.Text strong>Tiempo promedio de cierre</Typography.Text>
                <div className="mt-2">
                  <TagCantidad
                    valor={`${tiempoPromedio.data?.tiempoPromedioDias ?? 0} días`}
                    color="#6366f1"
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12} xl={6}>
          <Card title="Tiempo de respuesta" className="rounded-3xl h-full">
            <Space direction="vertical" size={12} className="w-full">
              <div className="rounded-2xl border border-municipal-100 p-4">
                <Typography.Text strong>Cerradas analizadas</Typography.Text>
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
                  <TagCantidad valor={formatearDias(valor)} color="#ef4444" />
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </PaginaModulo>
  );
}
