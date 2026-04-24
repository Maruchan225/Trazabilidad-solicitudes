import { apiClient } from '@/servicios/api/client';
import type { Area } from '@/tipos/areas';

export const areasService = {
  listar() {
    return apiClient.get<Area[]>('/areas');
  },
};
