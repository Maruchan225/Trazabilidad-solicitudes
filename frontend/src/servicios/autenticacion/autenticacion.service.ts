import { apiClient } from '@/servicios/api/client';
import type {
  CredencialesLogin,
  RespuestaLogin,
  SesionAutenticada,
} from '@/tipos/autenticacion';

export const autenticacionService = {
  async iniciarSesion(
    credenciales: CredencialesLogin,
  ): Promise<SesionAutenticada> {
    const respuesta = await apiClient.post<RespuestaLogin>(
      '/auth/login',
      credenciales,
      { token: null },
    );

    return {
      accessToken: respuesta.access_token,
      usuario: respuesta.usuario,
    };
  },
};
