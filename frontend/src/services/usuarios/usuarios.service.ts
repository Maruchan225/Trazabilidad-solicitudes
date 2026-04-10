import { apiClient } from '@/services/api/client';
import type { Usuario, UsuarioPayload } from '@/types/usuarios';

export const usuariosService = {
  listar() {
    return apiClient.get<Usuario[]>('/usuarios');
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
