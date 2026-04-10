import { Col, Row, Tag } from 'antd';
import { TarjetaTablaReporte } from '@/componentes/reportes/TarjetaTablaReporte';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { useConsulta } from '@/ganchos/useConsulta';
import { reportesService } from '@/servicios/reportes/reportes.service';
import type {
  CargaPorTrabajador,
  SolicitudVencidaReporte,
  SolicitudesPorArea,
  SolicitudesPorTipo,
} from '@/tipos/reportes';
import { crearTarjetasResumenReportes } from '@/utilidades/reportes';

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
      descripcion="Informes detallados sobre el estado de las solicitudes en el sistema."
      tarjetas={crearTarjetasResumenReportes(resumen.data, tiempoPromedio.data)}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <TarjetaTablaReporte
            titulo="Solicitudes por estado"
            consulta={{
              loading: estados.loading,
              error: estados.error,
              data: estados.data?.items ?? null,
            }}
            rowKey="estado"
            pagination={false}
            emptyDescription="No hay datos por estado."
            columns={[
              {
                title: 'Estado',
                dataIndex: 'estado',
                sorter: (a, b) => a.estado.localeCompare(b.estado),
                render: (estado) => <TagEstadoSolicitud estado={estado} />,
              },
              {
                title: 'Cantidad',
                dataIndex: 'cantidad',
                sorter: (a, b) => a.cantidad - b.cantidad,
              },
            ]}
          />
        </Col>
        <Col xs={24} xl={10}>
          <TarjetaTablaReporte<CargaPorTrabajador>
            titulo="Carga por trabajador"
            consulta={carga}
            rowKey="trabajadorId"
            pagination={false}
            emptyDescription="No hay carga asignada."
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
        </Col>
        <Col xs={24} xl={12}>
          <TarjetaTablaReporte<SolicitudesPorArea>
            titulo="Solicitudes por area"
            consulta={areas}
            rowKey="areaId"
            pagination={false}
            emptyDescription="No hay datos por area."
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
        </Col>
        <Col xs={24} xl={12}>
          <TarjetaTablaReporte<SolicitudesPorTipo>
            titulo="Solicitudes por tipo"
            consulta={tipos}
            rowKey="tipoSolicitudId"
            pagination={false}
            emptyDescription="No hay datos por tipo."
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
        </Col>
        <Col xs={24}>
          <TarjetaTablaReporte<SolicitudVencidaReporte>
            titulo="Solicitudes vencidas"
            consulta={vencidas}
            rowKey="id"
            pagination={{ pageSize: 6 }}
            emptyDescription="No hay solicitudes vencidas."
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
                render: (dias: number) => <Tag color="#111827">{dias}</Tag>,
              },
            ]}
          />
        </Col>
      </Row>
    </PaginaModulo>
  );
}
