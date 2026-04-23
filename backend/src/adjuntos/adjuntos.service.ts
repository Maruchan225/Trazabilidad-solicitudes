import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccionHistorialSolicitud, Prisma, RolUsuario } from '@prisma/client';
import { createReadStream } from 'fs';
import { access, unlink } from 'fs/promises';
import type { Express } from 'express';
import { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { handlePrismaError } from '../comun/prisma-error.util';
import { USUARIO_PUBLICO_CON_AREA_ARGS } from '../comun/usuario-seguro.util';
import { construirFiltroVisibilidadSolicitudes } from '../comun/visibilidad-solicitudes.util';
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

    const solicitud = await this.asegurarSolicitudVisible(solicitudId, usuario);

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

        await this.crearHistorialAdjunto(tx, {
          solicitudId,
          usuarioId: usuario.id,
          accion: AccionHistorialSolicitud.ADJUNTO_SUBIDO,
          estadoOrigen: solicitud.estado,
          estadoDestino: solicitud.estado,
          areaDestinoId: solicitud.areaActualId,
          asignadoDestinoId: solicitud.asignadoAId,
          comentario: `Adjunto subido: ${archivo.originalname}`,
        });

        return adjunto;
      });

      return adjuntoCreado;
    } catch (error) {
      handlePrismaError(error, 'adjunto');
    }
  }

  async listarPorSolicitud(solicitudId: number, usuario: UsuarioToken) {
    await this.asegurarSolicitudVisible(solicitudId, usuario);

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
    const adjunto = await this.asegurarAdjuntoVisible(id, usuario);
    return adjunto;
  }

  async obtenerArchivoAdjunto(id: number, usuario: UsuarioToken) {
    const adjunto = await this.asegurarAdjuntoVisible(id, usuario);

    try {
      await access(adjunto.ruta);
    } catch (error) {
      const codigo = (error as NodeJS.ErrnoException).code;

      if (codigo === 'ENOENT') {
        throw new NotFoundException(
          `El archivo del adjunto ${id} no se encuentra disponible`,
        );
      }

      throw error;
    }

    return {
      adjunto,
      stream: createReadStream(adjunto.ruta),
    };
  }

  async eliminarAdjunto(id: number, usuario: UsuarioToken) {
    const adjunto = await this.asegurarAdjuntoVisible(id, usuario);
    this.validarPermisoEliminacionAdjunto(adjunto.subidoPorId, usuario);

    await this.prisma.$transaction(async (tx) => {
      await tx.adjunto.delete({
        where: { id },
      });

      await this.crearHistorialAdjunto(tx, {
        solicitudId: adjunto.solicitudId,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.ADJUNTO_ELIMINADO,
        estadoOrigen: adjunto.solicitud.estado,
        estadoDestino: adjunto.solicitud.estado,
        areaDestinoId: adjunto.solicitud.areaActualId,
        asignadoDestinoId: adjunto.solicitud.asignadoAId,
        comentario: `Adjunto eliminado: ${adjunto.nombreOriginal}`,
      });
    });

    await this.eliminarArchivoSiExiste(adjunto.ruta);

    return {
      message: `Adjunto ${id} eliminado correctamente`,
    };
  }

  private async asegurarSolicitudVisible(
    solicitudId: number,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.prisma.solicitud.findFirst({
      where: {
        id: solicitudId,
        eliminadoEn: null,
        ...construirFiltroVisibilidadSolicitudes(usuario),
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    return solicitud;
  }

  private async asegurarAdjuntoVisible(id: number, usuario: UsuarioToken) {
    const adjunto = await this.prisma.adjunto.findFirst({
      where: {
        id,
        solicitud: {
          eliminadoEn: null,
          ...construirFiltroVisibilidadSolicitudes(usuario),
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

  private validarPermisoEliminacionAdjunto(
    subidoPorId: number | null,
    usuario: UsuarioToken,
  ) {
    if (usuario.rol === RolUsuario.TRABAJADOR && subidoPorId !== usuario.id) {
      throw new ForbiddenException(
        'Solo puede eliminar adjuntos que usted haya subido',
      );
    }
  }

  private async eliminarArchivoSiExiste(ruta: string) {
    try {
      await unlink(ruta);
    } catch (error) {
      const codigo = (error as NodeJS.ErrnoException).code;

      if (codigo !== 'ENOENT') {
        throw error;
      }
    }
  }

  private crearHistorialAdjunto(
    tx: Prisma.TransactionClient,
    data: Prisma.HistorialSolicitudUncheckedCreateInput,
  ) {
    return tx.historialSolicitud.create({ data });
  }

  private readonly adjuntoInclude = {
    subidoPor: USUARIO_PUBLICO_CON_AREA_ARGS,
  } satisfies Prisma.AdjuntoInclude;
}
