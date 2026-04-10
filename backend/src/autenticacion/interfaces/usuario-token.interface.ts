import { RolUsuario } from '@prisma/client';

export interface UsuarioToken {
  id: number;
  correo: string;
  rol: RolUsuario;
  areaId: number;
}
