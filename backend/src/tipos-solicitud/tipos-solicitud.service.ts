import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoSolicitudDto as CreateRequestTypeDto } from './dto/create-tipo-solicitud.dto';
import { UpdateTipoSolicitudDto as UpdateRequestTypeDto } from './dto/update-tipo-solicitud.dto';

@Injectable()
export class TiposSolicitudService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly mensajeCatalogoSoloLectura =
    'Los tipos de solicitud se administran como configuracion inicial de DOM';

  async create(createRequestTypeDto: CreateRequestTypeDto) {
    void createRequestTypeDto;
    throw new ForbiddenException(this.mensajeCatalogoSoloLectura);
  }

  list() {
    return this.prisma.tipoSolicitud.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findById(id: number) {
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

  async update(id: number, updateRequestTypeDto: UpdateRequestTypeDto) {
    void id;
    void updateRequestTypeDto;
    throw new ForbiddenException(this.mensajeCatalogoSoloLectura);
  }

  async remove(id: number) {
    void id;
    throw new ForbiddenException(this.mensajeCatalogoSoloLectura);
  }

  async ensureExists(id: number) {
    return this.findById(id);
  }
}
