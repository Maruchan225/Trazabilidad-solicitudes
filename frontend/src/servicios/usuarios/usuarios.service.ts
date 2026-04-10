import { apiClient } from '@/servicios/api/client';
import type { Usuario, UsuarioPayload } from '@/tipos/usuarios';

type FiltrosUsuarios = {
  busqueda?: string;
  rol?: string;
  areaId?: number;
  activo?: boolean;
};

function construirQuery(filtros?: FiltrosUsuarios) {
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

export const usuariosService = {
  listar(filtros?: FiltrosUsuarios) {
    return apiClient.get<Usuario[]>(`/usuarios${construirQuery(filtros)}`);
  },
  obtenerPorId(id: number) {
    return apiClient.get<Usuario>(`/usuarios/${id}`);
  },
  crear(payload: UsuarioPayload & { contrasena: string }) {
    return apiClient.post<Usuario>('/usuarios', payload);
  },
  actualizar(id: number, payload: Partial<UsuarioPayload>) {
    return apiClient.patch<Usuario>(`/usuarios/${id}`, payload);
  },
  eliminar(id: number) {
    return apiClient.delete<{ message: string }>(`/usuarios/${id}`);
  },
};
