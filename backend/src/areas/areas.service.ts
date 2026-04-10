import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../comun/prisma-error.util';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(createAreaDto: CreateAreaDto) {
    try {
      return await this.prisma.area.create({
        data: createAreaDto,
      });
    } catch (error) {
      handlePrismaError(error, 'area');
    }
  }

  listar() {
    return this.prisma.area.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: number) {
    const area = await this.prisma.area.findUnique({
      where: { id },
    });

    if (!area) {
      throw new NotFoundException(`Area con id ${id} no encontrada`);
    }

    return area;
  }

  async actualizar(id: number, updateAreaDto: UpdateAreaDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.area.update({
        where: { id },
        data: updateAreaDto,
      });
    } catch (error) {
      handlePrismaError(error, 'area');
    }
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    const usuariosAsignados = await this.prisma.usuario.count({
      where: { areaId: id },
    });

    if (usuariosAsignados > 0) {
      throw new ConflictException(
        'No se puede eliminar el area porque tiene usuarios asignados',
      );
    }

    return this.prisma.area.delete({
      where: { id },
    });
  }
}
