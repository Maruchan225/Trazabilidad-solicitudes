import type { Area } from '@/types/areas';
import type { RolUsuario } from '@/types/comun';

export type Usuario = {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  rol: RolUsuario;
  area: Area;
  activo: boolean;
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
