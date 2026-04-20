import { API_URL, ApiError, apiClient } from '@/servicios/api/client';
import { obtenerTokenGuardado } from '@/servicios/autenticacion/autenticacion.storage';
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

type ArchivoAdjunto = {
  blob: Blob;
  nombreArchivo: string;
  mimeType: string;
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

function obtenerNombreArchivoDesdeCabecera(contentDisposition: string | null) {
  if (!contentDisposition) {
    return 'adjunto';
  }

  const coincidenciaUtf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (coincidenciaUtf8?.[1]) {
    return decodeURIComponent(coincidenciaUtf8[1]);
  }

  const coincidenciaSimple = contentDisposition.match(/filename="?(.*?)"?(;|$)/i);
  return coincidenciaSimple?.[1] ?? 'adjunto';
}

async function obtenerArchivoAdjunto(
  id: number,
  descargar = false,
): Promise<ArchivoAdjunto> {
  const token = obtenerTokenGuardado();
  const url = `${API_URL}/adjuntos/${id}/archivo${descargar ? '?descargar=true' : ''}`;
  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Error inesperado al obtener el adjunto' }));

    throw new ApiError(
      error.message ?? 'Error inesperado al obtener el adjunto',
      response.status,
    );
  }

  return {
    blob: await response.blob(),
    nombreArchivo: obtenerNombreArchivoDesdeCabecera(
      response.headers.get('Content-Disposition'),
    ),
    mimeType:
      response.headers.get('Content-Type') ?? 'application/octet-stream',
  };
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
  obtenerAdjuntoArchivo(id: number) {
    return obtenerArchivoAdjunto(id);
  },
  descargarAdjuntoArchivo(id: number) {
    return obtenerArchivoAdjunto(id, true);
  },
  eliminarAdjunto(id: number) {
    return apiClient.delete<{ message: string }>(`/adjuntos/${id}`);
  },
};
