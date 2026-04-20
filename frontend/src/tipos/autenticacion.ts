import type { RolUsuario } from '@/tipos/comun';

export type UsuarioSesion = {
  id: number;
  correo: string;
  rut: string;
  rol: RolUsuario;
  areaId: number;
  nombres: string;
  apellidos: string;
};

export type CredencialesLogin = {
  email: string;
  contrasena: string;
};

export type RespuestaLogin = {
  access_token: string;
  usuario: UsuarioSesion;
};

export type SesionAutenticada = {
  accessToken: string;
  usuario: UsuarioSesion;
};
