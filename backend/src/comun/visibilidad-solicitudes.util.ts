import { Prisma, RolUsuario } from '@prisma/client';
import { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';

export function construirFiltroVisibilidadSolicitudes(
  usuario: UsuarioToken,
): Prisma.SolicitudWhereInput {
  if (usuario.rol === RolUsuario.TRABAJADOR) {
    return {
      OR: [{ asignadoAId: usuario.id }, { areaActualId: usuario.areaId }],
    };
  }

  return {};
}
