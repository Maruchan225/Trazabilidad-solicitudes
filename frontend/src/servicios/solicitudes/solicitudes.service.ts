import { apiClient } from '@/servicios/api/client';
import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';
import type {
  Adjunto,
  AsignarSolicitudPayload,
  CambiarEstadoSolicitudPayload,
  ComentarioSolicitudPayload,
  DerivarSolicitudPayload,
  ObservacionSolicitudPayload,
  Solicitud,
  SolicitudDetalle,
  SolicitudPayload,
} from '@/tipos/solicitudes';

type FiltrosSolicitudes = {
  busqueda?: string;
  estado?: EstadoSolicitud;
  areaId?: number;
  tipoSolicitudId?: number;
  prioridad?: PrioridadSolicitud;
};

function construirQuery(filtros?: FiltrosSolicitudes) {
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

export const solicitudesService = {
  listar(filtros?: FiltrosSolicitudes) {
    return apiClient.get<Solicitud[]>(`/solicitudes${construirQuery(filtros)}`);
  },
  obtenerPorId(id: number) {
    return apiClient.get<SolicitudDetalle>(`/solicitudes/${id}`);
  },
  crear(payload: SolicitudPayload) {
    return apiClient.post<SolicitudDetalle>('/solicitudes', payload);
  },
  asignar(id: number, payload: AsignarSolicitudPayload) {
    return apiClient.patch<SolicitudDetalle>(`/solicitudes/${id}/asignar`, payload);
  },
  derivar(id: number, payload: DerivarSolicitudPayload) {
    return apiClient.patch<SolicitudDetalle>(`/solicitudes/${id}/derivar`, payload);
  },
  cambiarEstado(id: number, payload: CambiarEstadoSolicitudPayload) {
    return apiClient.patch<SolicitudDetalle>(`/solicitudes/${id}/estado`, payload);
  },
  agregarObservacion(id: number, payload: ObservacionSolicitudPayload) {
    return apiClient.post<SolicitudDetalle>(
      `/solicitudes/${id}/observaciones`,
      payload,
    );
  },
  finalizar(id: number, payload: ComentarioSolicitudPayload) {
    return apiClient.patch<SolicitudDetalle>(`/solicitudes/${id}/finalizar`, payload);
  },
  cerrar(id: number, payload: ComentarioSolicitudPayload) {
    return apiClient.patch<SolicitudDetalle>(`/solicitudes/${id}/cerrar`, payload);
  },
  listarAdjuntos(id: number) {
    return apiClient.get<Adjunto[]>(`/adjuntos/solicitud/${id}`);
  },
  subirAdjunto(id: number, archivo: File) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return apiClient.post<Adjunto>(`/adjuntos/${id}`, formData);
  },
  eliminarAdjunto(id: number) {
    return apiClient.delete<{ message: string }>(`/adjuntos/${id}`);
  },
};
