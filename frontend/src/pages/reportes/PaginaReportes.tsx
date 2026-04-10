import { Card, Col, Row, Table, Tag } from 'antd';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useConsulta } from '@/hooks/useConsulta';
import { reportesService } from '@/services/reportes/reportes.service';
import type {
  CargaPorTrabajador,
  SolicitudVencidaReporte,
  SolicitudesPorArea,
  SolicitudesPorTipo,
} from '@/types/reportes';

export function PaginaReportes() {
  const resumen = useConsulta(() => reportesService.obtenerResumenGeneral(), []);
  const estados = useConsulta(
    () => reportesService.obtenerSolicitudesPorEstado(),
    [],
  );
  const areas = useConsulta(
    () => reportesService.obtenerSolicitudesPorArea(),
    [],
  );
  const carga = useConsulta(
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
  const tipos = useConsulta(
    () => reportesService.obtenerSolicitudesPorTipo(),
    [],
  );

  return (
    <PaginaModulo
      titulo="Reportes"
      descripcion="Vista conectada a los endpoints de reportes para alimentar dashboards del sistema."
      tarjetas={[
        {
          titulo: 'Total solicitudes',
          valor: resumen.data?.totalSolicitudes ?? 0,
        },
        {
          titulo: 'En proceso',
          valor: resumen.data?.solicitudesEnProceso ?? 0,
        },
        {
          titulo: 'Cerradas',
          valor: resumen.data?.solicitudesCerradas ?? 0,
        },
        {
          titulo: 'Proximas a vencer',
          valor: resumen.data?.solicitudesProximasAVencer ?? 0,
        },
        {
          titulo: 'Tiempo promedio',
          valor: `${tiempoPromedio.data?.tiempoPromedioDias ?? 0} dias`,
        },
      ]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="rounded-3xl" title="Solicitudes por estado">
            <EstadoConsulta
              loading={estados.loading}
              error={estados.error}
              data={estados.data}
              empty={(estados.data?.items.length ?? 0) === 0}
              emptyDescription="No hay datos por estado."
            >
              <Table
                pagination={false}
                rowKey="estado"
                dataSource={estados.data?.items ?? []}
                columns={[
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    sorter: (a, b) => a.estado.localeCompare(b.estado),
                    render: (estado: string) => <Tag color="blue">{estado}</Tag>,
                  },
                  {
                    title: 'Cantidad',
                    dataIndex: 'cantidad',
                    sorter: (a, b) => a.cantidad - b.cantidad,
                  },
                ]}
              />
            </EstadoConsulta>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="rounded-3xl" title="Carga por trabajador">
            <EstadoConsulta
              loading={carga.loading}
              error={carga.error}
              data={carga.data}
              empty={(carga.data?.length ?? 0) === 0}
              emptyDescription="No hay carga asignada."
            >
              <Table<CargaPorTrabajador>
                pagination={false}
                rowKey="trabajadorId"
                dataSource={carga.data ?? []}
                columns={[
                  {
                    title: 'Trabajador',
                    dataIndex: 'nombreCompleto',
                    sorter: (a, b) =>
                      a.nombreCompleto.localeCompare(b.nombreCompleto),
                  },
                  {
                    title: 'Area',
                    dataIndex: 'area',
                    sorter: (a, b) => a.area.localeCompare(b.area),
                  },
                  {
                    title: 'Asignadas',
                    dataIndex: 'totalAsignadas',
                    sorter: (a, b) => a.totalAsignadas - b.totalAsignadas,
                  },
                ]}
              />
            </EstadoConsulta>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="rounded-3xl" title="Solicitudes por area">
            <EstadoConsulta
              loading={areas.loading}
              error={areas.error}
              data={areas.data}
              empty={(areas.data?.length ?? 0) === 0}
              emptyDescription="No hay datos por area."
            >
              <Table<SolicitudesPorArea>
                pagination={false}
                rowKey="areaId"
                dataSource={areas.data ?? []}
                columns={[
                  {
                    title: 'Area',
                    dataIndex: 'area',
                    sorter: (a, b) => a.area.localeCompare(b.area),
                  },
                  {
                    title: 'Cantidad',
                    dataIndex: 'cantidad',
                    sorter: (a, b) => a.cantidad - b.cantidad,
                  },
                ]}
              />
            </EstadoConsulta>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="rounded-3xl" title="Solicitudes por tipo">
            <EstadoConsulta
              loading={tipos.loading}
              error={tipos.error}
              data={tipos.data}
              empty={(tipos.data?.length ?? 0) === 0}
              emptyDescription="No hay datos por tipo."
            >
              <Table<SolicitudesPorTipo>
                pagination={false}
                rowKey="tipoSolicitudId"
                dataSource={tipos.data ?? []}
                columns={[
                  {
                    title: 'Tipo',
                    dataIndex: 'tipoSolicitud',
                    sorter: (a, b) =>
                      a.tipoSolicitud.localeCompare(b.tipoSolicitud),
                  },
                  {
                    title: 'Cantidad',
                    dataIndex: 'cantidad',
                    sorter: (a, b) => a.cantidad - b.cantidad,
                  },
                ]}
              />
            </EstadoConsulta>
          </Card>
        </Col>
        <Col xs={24}>
          <Card className="rounded-3xl" title="Solicitudes vencidas">
            <EstadoConsulta
              loading={vencidas.loading}
              error={vencidas.error}
              data={vencidas.data}
              empty={(vencidas.data?.length ?? 0) === 0}
              emptyDescription="No hay solicitudes vencidas."
            >
              <Table<SolicitudVencidaReporte>
                rowKey="id"
                dataSource={vencidas.data ?? []}
                pagination={{ pageSize: 6 }}
                columns={[
                  { title: 'ID', dataIndex: 'id', sorter: (a, b) => a.id - b.id },
                  {
                    title: 'Titulo',
                    dataIndex: 'titulo',
                    sorter: (a, b) => a.titulo.localeCompare(b.titulo),
                  },
                  {
                    title: 'Area',
                    dataIndex: 'area',
                    sorter: (a, b) => a.area.localeCompare(b.area),
                  },
                  {
                    title: 'Tipo',
                    dataIndex: 'tipoSolicitud',
                    sorter: (a, b) =>
                      a.tipoSolicitud.localeCompare(b.tipoSolicitud),
                  },
                  {
                    title: 'Asignado a',
                    dataIndex: 'asignadoA',
                    sorter: (a, b) =>
                      (a.asignadoA ?? '').localeCompare(b.asignadoA ?? ''),
                  },
                  {
                    title: 'Dias atraso',
                    dataIndex: 'diasAtraso',
                    sorter: (a, b) => a.diasAtraso - b.diasAtraso,
                    render: (dias: number) => <Tag color="red">{dias}</Tag>,
                  },
                ]}
              />
            </EstadoConsulta>
          </Card>
        </Col>
      </Row>
    </PaginaModulo>
  );
}
