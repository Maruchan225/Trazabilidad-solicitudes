import { Col, Row } from 'antd';
import { TarjetaTablaReporte } from '@/componentes/reportes/TarjetaTablaReporte';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { TagCantidad } from '@/componentes/ui/tags/TagCantidad';
import { useConsulta } from '@/ganchos/useConsulta';
import { reportesService } from '@/servicios/reportes/reportes.service';
import type {
  CargaPorTrabajador,
  SolicitudVencidaReporte,
  SolicitudesPorPrioridad,
  SolicitudesPorTipo,
} from '@/tipos/reportes';
import {
  COLOR_SEMAFORO_AMARILLO,
  COLOR_SEMAFORO_ROJO,
  COLOR_SEMAFORO_VERDE,
} from '@/utilidades/estadoVisual';
import { formatearDias } from '@/utilidades/reportes';

export function PaginaReportes() {
  const resumen = useConsulta(
    () => reportesService.obtenerResumenGeneral(),
    [],
  );
  const estados = useConsulta(
    () => reportesService.obtenerSolicitudesPorEstado(),
    [],
  );
  const prioridades = useConsulta(
    () => reportesService.obtenerSolicitudesPorPrioridad(),
    [],
  );
  const carga = useConsulta(
    () => reportesService.obtenerCargaPorTrabajador(),
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
      titulo="Reportes operativos"
      descripcion="Vista analitica de DOM con foco en usuario, estado, prioridad, vencimiento y tipos de solicitud."
      tarjetas={[
        { titulo: 'En proceso', valor: resumen.data?.solicitudesEnProceso ?? 0 },
        { titulo: 'Por vencer', valor: resumen.data?.solicitudesProximasAVencer ?? 0 },
        { titulo: 'Vencidas', valor: resumen.data?.solicitudesVencidas ?? 0 },
        { titulo: 'Cerradas', valor: resumen.data?.solicitudesCerradas ?? 0 },
      ]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <TarjetaTablaReporte<CargaPorTrabajador>
            titulo="Carga por usuario"
            className="h-full rounded-3xl"
            consulta={carga}
            rowKey="trabajadorId"
            pagination={false}
            emptyDescription="No hay carga asignada."
            columns={[
              {
                title: 'Usuario',
                dataIndex: 'nombreCompleto',
                sorter: (a, b) =>
                  a.nombreCompleto.localeCompare(b.nombreCompleto),
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
                sorter: (a, b) => a.vencidas - b.vencidas,
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
        <Col xs={24} xl={8}>
          <TarjetaTablaReporte
            titulo="Solicitudes por estado"
            className="h-full rounded-3xl"
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
        <Col xs={24} xl={12}>
          <TarjetaTablaReporte<SolicitudesPorPrioridad>
            titulo="Solicitudes por prioridad"
            className="h-full rounded-3xl"
            consulta={prioridades}
            rowKey="prioridad"
            pagination={false}
            emptyDescription="No hay datos por prioridad."
            columns={[
              {
                title: 'Prioridad',
                dataIndex: 'prioridad',
              },
              {
                title: 'Cantidad',
                dataIndex: 'cantidad',
                sorter: (a, b) => a.cantidad - b.cantidad,
                render: (valor: number, record) => (
                  <TagCantidad
                    valor={valor}
                    color={
                      record.prioridad === 'BAJA'
                        ? COLOR_SEMAFORO_VERDE
                        : record.prioridad === 'MEDIA'
                          ? COLOR_SEMAFORO_AMARILLO
                          : COLOR_SEMAFORO_ROJO
                    }
                  />
                ),
              },
            ]}
          />
        </Col>
        <Col xs={24} xl={12}>
          <TarjetaTablaReporte<SolicitudesPorTipo>
            titulo="Tipos de solicitud mas frecuentes"
            className="h-full rounded-3xl"
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
              {
                title: 'Correlativo',
                dataIndex: 'correlativo',
                render: (correlativo: number | null | undefined) =>
                  correlativo ?? '-',
              },
              {
                title: 'Titulo',
                dataIndex: 'titulo',
                sorter: (a, b) => a.titulo.localeCompare(b.titulo),
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
                render: (dias: number) => (
                  <TagCantidad valor={formatearDias(dias)} color={COLOR_SEMAFORO_ROJO} />
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </PaginaModulo>
  );
}
