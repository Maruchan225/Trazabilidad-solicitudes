import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolUsuario } from '@prisma/client';
import type { Express } from 'express';
import type { Response } from 'express';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/decoradores/usuario-autenticado.decorator';
import type { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { opcionesMulterAdjuntos } from './configuracion/adjuntos-multer.config';
import { AdjuntosService } from './adjuntos.service';

@Controller('adjuntos')
@Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
export class AdjuntosController {
  constructor(private readonly adjuntosService: AdjuntosService) {}

  private construirContentDisposition(
    tipo: 'inline' | 'attachment',
    nombreOriginal: string,
  ) {
    const nombreAscii =
      nombreOriginal
        .normalize('NFKD')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/["\\]/g, '_') || 'adjunto';
    const nombreUtf8 = encodeURIComponent(nombreOriginal);

    return `${tipo}; filename="${nombreAscii}"; filename*=UTF-8''${nombreUtf8}`;
  }

  @Post(':solicitudId')
  @UseInterceptors(FileInterceptor('archivo', opcionesMulterAdjuntos))
  subirAdjunto(
    @Param('solicitudId', ParseIntPipe) solicitudId: number,
    @UploadedFile() archivo: Express.Multer.File,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.adjuntosService.subirAdjunto(solicitudId, archivo, usuario);
  }

  @Get('solicitud/:solicitudId')
  listarPorSolicitud(
    @Param('solicitudId', ParseIntPipe) solicitudId: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.adjuntosService.listarPorSolicitud(solicitudId, usuario);
  }

  @Get(':id/archivo')
  async obtenerArchivo(
    @Param('id', ParseIntPipe) id: number,
    @Query('descargar') descargar: string | undefined,
    @UsuarioAutenticado() usuario: UsuarioToken,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { adjunto, stream } = await this.adjuntosService.obtenerArchivoAdjunto(
      id,
      usuario,
    );
    const disposition = descargar === 'true' ? 'attachment' : 'inline';

    response.setHeader('Content-Type', adjunto.mimeType);
    response.setHeader(
      'Content-Disposition',
      this.construirContentDisposition(disposition, adjunto.nombreOriginal),
    );

    return new StreamableFile(stream);
  }

  @Get(':id')
  obtenerInformacion(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.adjuntosService.obtenerInformacion(id, usuario);
  }

  @Delete(':id')
  eliminarAdjunto(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.adjuntosService.eliminarAdjunto(id, usuario);
  }
}
