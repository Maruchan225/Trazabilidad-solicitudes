import { Injectable } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistorialSolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.historialSolicitud.findMany({
      include: {
        solicitud: true,
        usuario: true,
        areaOrigen: true,
        areaDestino: true,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  listarPorSolicitud(solicitudId: number, usuario: UsuarioToken) {
    return this.prisma.historialSolicitud.findMany({
      where: {
        solicitudId,
        ...(usuario.rol === RolUsuario.TRABAJADOR
          ? {
              solicitud: {
                eliminadoEn: null,
                OR: [
                  { asignadoAId: usuario.id },
                  { areaActualId: usuario.areaId },
                ],
              },
            }
          : {}),
      },
      include: {
        usuario: {
          omit: {
            contrasena: true,
          },
        },
        areaOrigen: true,
        areaDestino: true,
      },
      orderBy: {
        creadoEn: 'asc',
      },
    });
  }
}
