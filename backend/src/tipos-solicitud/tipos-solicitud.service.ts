import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoSolicitudDto } from './dto/create-tipo-solicitud.dto';
import { UpdateTipoSolicitudDto } from './dto/update-tipo-solicitud.dto';

@Injectable()
export class TiposSolicitudService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly mensajeCatalogoSoloLectura =
    'Los tipos de solicitud se administran como configuracion inicial de DOM';

  async crear(createTipoSolicitudDto: CreateTipoSolicitudDto) {
    void createTipoSolicitudDto;
    throw new ForbiddenException(this.mensajeCatalogoSoloLectura);
  }

  listar() {
    return this.prisma.tipoSolicitud.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: number) {
    const tipoSolicitud = await this.prisma.tipoSolicitud.findUnique({
      where: { id },
    });

    if (!tipoSolicitud) {
      throw new NotFoundException(
        `Tipo de solicitud con id ${id} no encontrado`,
      );
    }

    return tipoSolicitud;
  }

  async actualizar(id: number, updateTipoSolicitudDto: UpdateTipoSolicitudDto) {
    void id;
    void updateTipoSolicitudDto;
    throw new ForbiddenException(this.mensajeCatalogoSoloLectura);
  }

  async eliminar(id: number) {
    void id;
    throw new ForbiddenException(this.mensajeCatalogoSoloLectura);
  }

  async asegurarExistencia(id: number) {
    return this.obtenerPorId(id);
  }
}
