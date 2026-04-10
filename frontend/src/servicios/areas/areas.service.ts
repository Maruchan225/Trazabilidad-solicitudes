import { apiClient } from '@/servicios/api/client';
import type { Area, AreaPayload } from '@/tipos/areas';

export const areasService = {
  listar() {
    return apiClient.get<Area[]>('/areas');
  },
  crear(payload: AreaPayload) {
    return apiClient.post<Area>('/areas', payload);
  },
  actualizar(id: number, payload: Partial<AreaPayload>) {
    return apiClient.patch<Area>(`/areas/${id}`, payload);
  },
  eliminar(id: number) {
    return apiClient.delete<{ message: string }>(`/areas/${id}`);
  },
};
