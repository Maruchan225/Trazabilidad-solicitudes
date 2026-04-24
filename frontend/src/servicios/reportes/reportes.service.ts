import { apiClient } from '@/servicios/api/client';
import type {
  CargaPorTrabajador,
  DashboardTrabajador,
  FiltrosReportes,
  ResumenGeneral,
  SolicitudVencidaReporte,
  SolicitudesPorEstado,
  SolicitudesPorPrioridad,
  SolicitudesPorTipo,
  TiempoPromedioRespuesta,
} from '@/tipos/reportes';

function construirQuery(filtros?: FiltrosReportes) {
  if (!filtros) {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(clave, String(valor));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const reportesService = {
  obtenerResumenGeneral(filtros?: FiltrosReportes) {
    return apiClient.get<ResumenGeneral>(
      `/reportes/resumen-general${construirQuery(filtros)}`,
    );
  },
  obtenerSolicitudesPorEstado(filtros?: FiltrosReportes) {
    return apiClient.get<SolicitudesPorEstado>(
      `/reportes/solicitudes-por-estado${construirQuery(filtros)}`,
    );
  },
  obtenerCargaPorTrabajador(filtros?: FiltrosReportes) {
    return apiClient.get<CargaPorTrabajador[]>(
      `/reportes/carga-por-trabajador${construirQuery(filtros)}`,
    );
  },
  obtenerTiempoPromedioRespuesta(filtros?: FiltrosReportes) {
    return apiClient.get<TiempoPromedioRespuesta>(
      `/reportes/tiempo-promedio-respuesta${construirQuery(filtros)}`,
    );
  },
  obtenerSolicitudesVencidas(filtros?: FiltrosReportes) {
    return apiClient.get<SolicitudVencidaReporte[]>(
      `/reportes/solicitudes-vencidas${construirQuery(filtros)}`,
    );
  },
  obtenerSolicitudesPorTipo(filtros?: FiltrosReportes) {
    return apiClient.get<SolicitudesPorTipo[]>(
      `/reportes/solicitudes-por-tipo${construirQuery(filtros)}`,
    );
  },
  obtenerSolicitudesPorPrioridad(filtros?: FiltrosReportes) {
    return apiClient.get<SolicitudesPorPrioridad[]>(
      `/reportes/solicitudes-por-prioridad${construirQuery(filtros)}`,
    );
  },
  obtenerDashboardTrabajador() {
    return apiClient.get<DashboardTrabajador>('/reportes/dashboard-trabajador');
  },
};
