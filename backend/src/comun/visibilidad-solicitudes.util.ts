import { Prisma, RolUsuario } from '@prisma/client';
import { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';

export function buildRequestsVisibilityFilter(
  user: UsuarioToken,
): Prisma.SolicitudWhereInput {
  if (user.rol === RolUsuario.TRABAJADOR) {
    return { asignadoAId: user.id };
  }

  return {};
}
