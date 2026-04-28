import { Injectable } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { SAFE_USER_ARGS } from '../comun/usuario-seguro.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistorialSolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.historialSolicitud.findMany({
      include: {
        solicitud: true,
        usuario: SAFE_USER_ARGS,
        areaOrigen: true,
        areaDestino: true,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  listByRequest(solicitudId: number, usuario: UsuarioToken) {
    return this.prisma.historialSolicitud.findMany({
      where: {
        solicitudId,
        ...(usuario.rol === RolUsuario.TRABAJADOR
          ? {
              solicitud: {
                eliminadoEn: null,
                asignadoAId: usuario.id,
              },
            }
          : {}),
      },
      include: {
        usuario: SAFE_USER_ARGS,
        areaOrigen: true,
        areaDestino: true,
      },
      orderBy: {
        creadoEn: 'asc',
      },
    });
  }
}
