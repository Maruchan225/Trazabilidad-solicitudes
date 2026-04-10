import { apiClient } from '@/services/api/client';
import type {
  TipoSolicitud,
  TipoSolicitudPayload,
} from '@/types/tiposSolicitud';

export const tiposSolicitudService = {
  listar() {
    return apiClient.get<TipoSolicitud[]>('/tipos-solicitud');
  },
  crear(payload: TipoSolicitudPayload) {
    return apiClient.post<TipoSolicitud>('/tipos-solicitud', payload);
  },
  actualizar(id: number, payload: Partial<TipoSolicitudPayload>) {
    return apiClient.patch<TipoSolicitud>(`/tipos-solicitud/${id}`, payload);
  },
  eliminar(id: number) {
    return apiClient.delete<{ message: string }>(`/tipos-solicitud/${id}`);
  },
};
