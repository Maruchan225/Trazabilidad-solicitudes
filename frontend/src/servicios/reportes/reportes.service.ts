import { apiClient } from '@/servicios/api/client';
import type {
  CargaPorTrabajador,
  FiltrosReportes,
  ResumenGeneral,
  SolicitudVencidaReporte,
  SolicitudesPorArea,
  SolicitudesPorEstado,
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
  obtenerSolicitudesPorArea(filtros?: FiltrosReportes) {
    return apiClient.get<SolicitudesPorArea[]>(
      `/reportes/solicitudes-por-area${construirQuery(filtros)}`,
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
};
