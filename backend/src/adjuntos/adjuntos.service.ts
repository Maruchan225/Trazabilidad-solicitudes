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
import { SAFE_USER_WITH_AREA_ARGS } from '../comun/usuario-seguro.util';
import { buildRequestsVisibilityFilter } from '../comun/visibilidad-solicitudes.util';
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

    const request = await this.ensureVisibleRequest(solicitudId, usuario);

    try {
      const createdAttachment = await this.prisma.$transaction(async (tx) => {
        const attachment = await tx.adjunto.create({
          data: {
            nombreOriginal: archivo.originalname,
            nombreArchivo: archivo.filename,
            ruta: archivo.path.replace(/\\/g, '/'),
            mimeType: archivo.mimetype,
            tamano: archivo.size,
            solicitudId,
            subidoPorId: usuario.id,
          },
          include: this.attachmentInclude,
        });

        await this.createAttachmentHistory(tx, {
          solicitudId,
          usuarioId: usuario.id,
          accion: AccionHistorialSolicitud.ADJUNTO_SUBIDO,
          estadoOrigen: request.estado,
          estadoDestino: request.estado,
          asignadoDestinoId: request.asignadoAId,
          comentario: `Adjunto subido: ${archivo.originalname}`,
        });

        return attachment;
      });

      return createdAttachment;
    } catch (error) {
      handlePrismaError(error, 'adjunto');
    }
  }

  async listarPorSolicitud(solicitudId: number, usuario: UsuarioToken) {
    await this.ensureVisibleRequest(solicitudId, usuario);

    return this.prisma.adjunto.findMany({
      where: {
        solicitudId,
      },
      include: this.attachmentInclude,
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async obtenerInformacion(id: number, usuario: UsuarioToken) {
    const attachment = await this.ensureVisibleAttachment(id, usuario);
    return attachment;
  }

  async obtenerArchivoAdjunto(id: number, usuario: UsuarioToken) {
    const attachment = await this.ensureVisibleAttachment(id, usuario);

    try {
      await access(attachment.ruta);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === 'ENOENT') {
        throw new NotFoundException(
          `El archivo del adjunto ${id} no se encuentra disponible`,
        );
      }

      throw error;
    }

    return {
      adjunto: attachment,
      stream: createReadStream(attachment.ruta),
    };
  }

  async eliminarAdjunto(id: number, usuario: UsuarioToken) {
    const attachment = await this.ensureVisibleAttachment(id, usuario);
    this.validateAttachmentDeletionPermission(attachment.subidoPorId, usuario);

    await this.prisma.$transaction(async (tx) => {
      await tx.adjunto.delete({
        where: { id },
      });

      await this.createAttachmentHistory(tx, {
        solicitudId: attachment.solicitudId,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.ADJUNTO_ELIMINADO,
        estadoOrigen: attachment.solicitud.estado,
        estadoDestino: attachment.solicitud.estado,
        asignadoDestinoId: attachment.solicitud.asignadoAId,
        comentario: `Adjunto eliminado: ${attachment.nombreOriginal}`,
      });
    });

    await this.deleteFileIfExists(attachment.ruta);

    return {
      message: `Adjunto ${id} eliminado correctamente`,
    };
  }

  private async ensureVisibleRequest(
    solicitudId: number,
    usuario: UsuarioToken,
  ) {
    const request = await this.prisma.solicitud.findFirst({
      where: {
        id: solicitudId,
        eliminadoEn: null,
        ...buildRequestsVisibilityFilter(usuario),
      },
    });

    if (!request) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    return request;
  }

  private async ensureVisibleAttachment(id: number, usuario: UsuarioToken) {
    const attachment = await this.prisma.adjunto.findFirst({
      where: {
        id,
        solicitud: {
          eliminadoEn: null,
          ...buildRequestsVisibilityFilter(usuario),
        },
      },
      include: {
        ...this.attachmentInclude,
        solicitud: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException(`Adjunto con id ${id} no encontrado`);
    }

    return attachment;
  }

  private validateAttachmentDeletionPermission(
    uploadedById: number | null,
    usuario: UsuarioToken,
  ) {
    if (usuario.rol === RolUsuario.TRABAJADOR && uploadedById !== usuario.id) {
      throw new ForbiddenException(
        'Solo puede eliminar adjuntos que usted haya subido',
      );
    }
  }

  private async deleteFileIfExists(path: string) {
    try {
      await unlink(path);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private createAttachmentHistory(
    tx: Prisma.TransactionClient,
    data: Prisma.HistorialSolicitudUncheckedCreateInput,
  ) {
    return tx.historialSolicitud.create({ data });
  }

  private readonly attachmentInclude = {
    subidoPor: SAFE_USER_WITH_AREA_ARGS,
  } satisfies Prisma.AdjuntoInclude;
}
