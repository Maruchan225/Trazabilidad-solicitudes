import { Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../comun/prisma-error.util';
import { normalizarRut } from '../comun/rut.util';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { FiltroUsuariosDto } from './dto/filtro-usuarios.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapearUsuarioConTotales<
    T extends {
      _count?: {
        solicitudesAsignadas?: number;
      };
    },
  >(usuario: T) {
    const { _count, ...resto } = usuario;

    return {
      ...resto,
      totalSolicitudes: _count?.solicitudesAsignadas ?? 0,
    };
  }

  async crear(createUsuarioDto: CreateUsuarioDto) {
    await this.asegurarExistenciaArea(createUsuarioDto.areaId);

    try {
      const contrasenaHasheada = await this.hashContrasena(
        createUsuarioDto.contrasena,
      );

      const usuario = await this.prisma.usuario.create({
        data: {
          ...createUsuarioDto,
          rut: normalizarRut(createUsuarioDto.rut) ?? createUsuarioDto.rut,
          contrasena: contrasenaHasheada,
        },
        include: {
          area: true,
          _count: {
            select: {
              solicitudesAsignadas: true,
            },
          },
        },
        omit: {
          contrasena: true,
        },
      });

      return this.mapearUsuarioConTotales(usuario);
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
  }

  async listar(filtros: FiltroUsuariosDto) {
    const where = this.construirWhere(filtros);
    const usuarios = await this.prisma.usuario.findMany({
      where,
      omit: {
        contrasena: true,
      },
      include: {
        area: true,
        _count: {
          select: {
            solicitudesAsignadas: true,
          },
        },
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      ...(typeof filtros.offset === 'number' ? { skip: filtros.offset } : {}),
      ...(typeof filtros.limite === 'number' ? { take: filtros.limite } : {}),
    });

    return usuarios.map((usuario) => this.mapearUsuarioConTotales(usuario));
  }

  async obtenerPorId(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      omit: {
        contrasena: true,
      },
      include: {
        area: true,
        _count: {
          select: {
            solicitudesAsignadas: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return this.mapearUsuarioConTotales(user);
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
            ...(updateUsuarioDto.rut
              ? {
                  rut: normalizarRut(updateUsuarioDto.rut) ?? updateUsuarioDto.rut,
                }
              : {}),
            contrasena: await this.hashContrasena(updateUsuarioDto.contrasena),
          }
        : {
            ...updateUsuarioDto,
            ...(updateUsuarioDto.rut
              ? {
                  rut: normalizarRut(updateUsuarioDto.rut) ?? updateUsuarioDto.rut,
                }
              : {}),
          };

      const usuario = await this.prisma.usuario.update({
        where: { id },
        data,
        include: {
          area: true,
          _count: {
            select: {
              solicitudesAsignadas: true,
            },
          },
        },
        omit: {
          contrasena: true,
        },
      });

      return this.mapearUsuarioConTotales(usuario);
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.usuario.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
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

  private construirWhere(filtros: FiltroUsuariosDto): Prisma.UsuarioWhereInput {
    const busqueda = filtros.busqueda?.trim();
    const rutNormalizado = normalizarRut(busqueda);
    const filtroRut: Prisma.UsuarioWhereInput | undefined = busqueda
      ? {
          rut: {
            contains: rutNormalizado ?? busqueda,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : undefined;
    const rolesCoincidentes = ['ENCARGADO', 'REEMPLAZO', 'TRABAJADOR'].filter(
      (rol) => rol.toLowerCase().includes(busqueda?.toLowerCase() ?? ''),
    );

    return {
      ...(filtros.rol ? { rol: filtros.rol } : {}),
      ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
      ...(typeof filtros.activo === 'boolean'
        ? { activo: filtros.activo }
        : {}),
      ...(busqueda
        ? {
            OR: [
              { nombres: { contains: busqueda, mode: 'insensitive' } },
              { apellidos: { contains: busqueda, mode: 'insensitive' } },
              { email: { contains: busqueda, mode: 'insensitive' } },
              ...(filtroRut ? [filtroRut] : []),
              ...(rolesCoincidentes.length > 0
                ? [{ rol: { in: rolesCoincidentes as never[] } }]
                : []),
              {
                area: {
                  nombre: { contains: busqueda, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
  }
}
