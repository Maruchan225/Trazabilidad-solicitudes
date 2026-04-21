import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../comun/prisma-error.util';
import { CreateTipoSolicitudDto } from './dto/create-tipo-solicitud.dto';
import { UpdateTipoSolicitudDto } from './dto/update-tipo-solicitud.dto';

@Injectable()
export class TiposSolicitudService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(createTipoSolicitudDto: CreateTipoSolicitudDto) {
    try {
      return await this.prisma.tipoSolicitud.create({
        data: createTipoSolicitudDto,
      });
    } catch (error) {
      handlePrismaError(error, 'tipo de solicitud');
    }
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
    await this.obtenerPorId(id);

    try {
      return await this.prisma.tipoSolicitud.update({
        where: { id },
        data: updateTipoSolicitudDto,
      });
    } catch (error) {
      handlePrismaError(error, 'tipo de solicitud');
    }
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.tipoSolicitud.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, 'tipo de solicitud');
    }
  }

  async asegurarExistencia(id: number) {
    return this.obtenerPorId(id);
  }
}
