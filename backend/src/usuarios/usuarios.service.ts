import { Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-error.util';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(createUsuarioDto: CreateUsuarioDto) {
    await this.asegurarExistenciaArea(createUsuarioDto.areaId);

    try {
      const contrasenaHasheada = await this.hashContrasena(
        createUsuarioDto.contrasena,
      );

      return await this.prisma.usuario.create({
        data: {
          ...createUsuarioDto,
          contrasena: contrasenaHasheada,
        },
        include: {
          area: true,
        },
        omit: {
          contrasena: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
  }

  listar() {
    return this.prisma.usuario.findMany({
      omit: {
        contrasena: true,
      },
      include: {
        area: true,
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    });
  }

  async obtenerPorId(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      omit: {
        contrasena: true,
      },
      include: {
        area: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return user;
  }

  async actualizar(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    await this.obtenerPorId(id);

    if (updateUsuarioDto.areaId) {
      await this.asegurarExistenciaArea(updateUsuarioDto.areaId);
    }

    try {
      const data = updateUsuarioDto.contrasena
        ? {
            ...updateUsuarioDto,
            contrasena: await this.hashContrasena(updateUsuarioDto.contrasena),
          }
        : updateUsuarioDto;

      return await this.prisma.usuario.update({
        where: { id },
        data,
        include: {
          area: true,
        },
        omit: {
          contrasena: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    return this.prisma.usuario.delete({
      where: { id },
    });
  }

  async asegurarExistencia(id: number) {
    return this.obtenerPorId(id);
  }

  async buscarPorCorreo(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        area: true,
      },
    });
  }

  validarContrasena(
    contrasenaPlano: string,
    contrasenaHash: string,
  ): Promise<boolean> {
    return compare(contrasenaPlano, contrasenaHash);
  }

  private hashContrasena(contrasena: string): Promise<string> {
    return hash(contrasena, 10);
  }

  private async asegurarExistenciaArea(areaId: number) {
    const area = await this.prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      throw new NotFoundException(`Area con id ${areaId} no encontrada`);
    }
  }
}
