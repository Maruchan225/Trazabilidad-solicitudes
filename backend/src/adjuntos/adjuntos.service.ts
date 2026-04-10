import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccionHistorialSolicitud, Prisma, RolUsuario } from '@prisma/client';
import { unlink } from 'fs/promises';
import type { Express } from 'express';
import { UsuarioToken } from '../auth/interfaces/usuario-token.interface';
import { handlePrismaError } from '../common/prisma-error.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdjuntosService {
  constructor(private readonly prisma: PrismaService) {}

  async subirAdjunto(
    solicitudId: number,
    archivo: Express.Multer.File | undefined,
    usuario: UsuarioToken,
  ) {
    if (!archivo) {
      throw new BadRequestException('Debe adjuntar un archivo valido');
    }

    const solicitud = await this.ensureSolicitudVisible(solicitudId, usuario);

    try {
      const adjuntoCreado = await this.prisma.$transaction(async (tx) => {
        const adjunto = await tx.adjunto.create({
          data: {
            nombreOriginal: archivo.originalname,
            nombreArchivo: archivo.filename,
            ruta: archivo.path.replace(/\\/g, '/'),
            mimeType: archivo.mimetype,
            tamano: archivo.size,
            solicitudId,
            subidoPorId: usuario.id,
          },
          include: this.adjuntoInclude,
        });

        await tx.historialSolicitud.create({
          data: {
            solicitudId,
            usuarioId: usuario.id,
            accion: AccionHistorialSolicitud.ADJUNTO_SUBIDO,
            estadoOrigen: solicitud.estado,
            estadoDestino: solicitud.estado,
            areaDestinoId: solicitud.areaActualId,
            asignadoDestinoId: solicitud.asignadoAId,
            comentario: `Adjunto subido: ${archivo.originalname}`,
          },
        });

        return adjunto;
      });

      return adjuntoCreado;
    } catch (error) {
      handlePrismaError(error, 'adjunto');
    }
  }

  async listarPorSolicitud(solicitudId: number, usuario: UsuarioToken) {
    await this.ensureSolicitudVisible(solicitudId, usuario);

    return this.prisma.adjunto.findMany({
      where: {
        solicitudId,
      },
      include: this.adjuntoInclude,
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async obtenerInformacion(id: number, usuario: UsuarioToken) {
    const adjunto = await this.ensureAdjuntoVisible(id, usuario);
    return adjunto;
  }

  async eliminarAdjunto(id: number, usuario: UsuarioToken) {
    const adjunto = await this.ensureAdjuntoVisible(id, usuario);

    if (
      usuario.rol === RolUsuario.TRABAJADOR &&
      adjunto.subidoPorId !== usuario.id
    ) {
      throw new ForbiddenException(
        'Solo puede eliminar adjuntos que usted haya subido',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.adjunto.delete({
        where: { id },
      });

      await tx.historialSolicitud.create({
        data: {
          solicitudId: adjunto.solicitudId,
          usuarioId: usuario.id,
          accion: AccionHistorialSolicitud.ADJUNTO_ELIMINADO,
          estadoOrigen: adjunto.solicitud.estado,
          estadoDestino: adjunto.solicitud.estado,
          areaDestinoId: adjunto.solicitud.areaActualId,
          asignadoDestinoId: adjunto.solicitud.asignadoAId,
          comentario: `Adjunto eliminado: ${adjunto.nombreOriginal}`,
        },
      });
    });

    try {
      await unlink(adjunto.ruta);
    } catch (error) {
      const codigo = (error as NodeJS.ErrnoException).code;
      if (codigo !== 'ENOENT') {
        throw error;
      }
    }

    return {
      message: `Adjunto ${id} eliminado correctamente`,
    };
  }

  private async ensureSolicitudVisible(
    solicitudId: number,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.prisma.solicitud.findFirst({
      where: {
        id: solicitudId,
        eliminadoEn: null,
        ...this.construirFiltroVisibilidad(usuario),
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    return solicitud;
  }

  private async ensureAdjuntoVisible(id: number, usuario: UsuarioToken) {
    const adjunto = await this.prisma.adjunto.findFirst({
      where: {
        id,
        solicitud: {
          eliminadoEn: null,
          ...this.construirFiltroVisibilidad(usuario),
        },
      },
      include: {
        ...this.adjuntoInclude,
        solicitud: true,
      },
    });

    if (!adjunto) {
      throw new NotFoundException(`Adjunto con id ${id} no encontrado`);
    }

    return adjunto;
  }

  private construirFiltroVisibilidad(
    usuario: UsuarioToken,
  ): Prisma.SolicitudWhereInput {
    if (usuario.rol === RolUsuario.TRABAJADOR) {
      return {
        OR: [{ asignadoAId: usuario.id }, { areaActualId: usuario.areaId }],
      };
    }

    return {};
  }

  private readonly adjuntoInclude = {
    subidoPor: {
      omit: {
        contrasena: true,
      },
      include: {
        area: true,
      },
    },
  } satisfies Prisma.AdjuntoInclude;
}
