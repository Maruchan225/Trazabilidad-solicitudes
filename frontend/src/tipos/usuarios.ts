import type { Area } from '@/tipos/areas';
import type { RolUsuario } from '@/tipos/comun';

export type Usuario = {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  rol: RolUsuario;
  area: Area;
  activo: boolean;
  totalSolicitudes: number;
  creadoEn: string;
  actualizadoEn: string;
};

export type UsuarioPayload = {
  nombres: string;
  apellidos: string;
  email: string;
  contrasena?: string;
  telefono?: string;
  rol: RolUsuario;
  areaId: number;
  activo?: boolean;
};
