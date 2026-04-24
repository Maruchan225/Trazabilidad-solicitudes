import { Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../comun/prisma-error.util';
import { normalizeRut } from '../comun/rut.util';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { FiltroUsuariosDto } from './dto/filtro-usuarios.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUserWithTotals<
    T extends {
      _count?: {
        solicitudesAsignadas?: number;
      };
    },
  >(user: T) {
    const { _count, ...rest } = user;

    return {
      ...rest,
      totalSolicitudes: _count?.solicitudesAsignadas ?? 0,
    };
  }

  async crear(createUsuarioDto: CreateUsuarioDto) {
    const areaId = await this.resolveTechnicalAreaId(createUsuarioDto.areaId);

    try {
      const hashedPassword = await this.hashPassword(
        createUsuarioDto.contrasena,
      );

      const user = await this.prisma.usuario.create({
        data: {
          ...createUsuarioDto,
          areaId,
          rut: normalizeRut(createUsuarioDto.rut) ?? createUsuarioDto.rut,
          contrasena: hashedPassword,
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

      return this.mapUserWithTotals(user);
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
  }

  async listar(filtros: FiltroUsuariosDto) {
    const where = this.buildWhereFilter(filtros);
    const users = await this.prisma.usuario.findMany({
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

    return users.map((user) => this.mapUserWithTotals(user));
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

    return this.mapUserWithTotals(user);
  }

  async actualizar(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    await this.obtenerPorId(id);

    if (updateUsuarioDto.areaId) {
      await this.ensureAreaExists(updateUsuarioDto.areaId);
    }

    try {
      const data = updateUsuarioDto.contrasena
        ? {
            ...updateUsuarioDto,
            ...(updateUsuarioDto.rut
              ? {
                  rut: normalizeRut(updateUsuarioDto.rut) ?? updateUsuarioDto.rut,
                }
              : {}),
            contrasena: await this.hashPassword(updateUsuarioDto.contrasena),
          }
        : {
            ...updateUsuarioDto,
            ...(updateUsuarioDto.rut
              ? {
                  rut: normalizeRut(updateUsuarioDto.rut) ?? updateUsuarioDto.rut,
                }
              : {}),
          };

      const user = await this.prisma.usuario.update({
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

      return this.mapUserWithTotals(user);
    } catch (error) {
      handlePrismaError(error, 'usuario');
    }
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    try {
      const user = await this.prisma.usuario.delete({
        where: { id },
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

      return this.mapUserWithTotals(user);
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

  buscarContextoAutenticacionPorId(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
        areaId: true,
        activo: true,
      },
    });
  }

  validarContrasena(
    contrasenaPlano: string,
    contrasenaHash: string,
  ): Promise<boolean> {
    return compare(contrasenaPlano, contrasenaHash);
  }

  private hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  private async ensureAreaExists(areaId: number) {
    const area = await this.prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      throw new NotFoundException(`Area con id ${areaId} no encontrada`);
    }
  }

  private async resolveTechnicalAreaId(areaId?: number) {
    if (typeof areaId === 'number') {
      await this.ensureAreaExists(areaId);
      return areaId;
    }

    const technicalArea = await this.prisma.area.findFirst({
      where: { activo: true },
      orderBy: [{ nombre: 'asc' }],
    });

    if (!technicalArea) {
      throw new NotFoundException(
        'No existe un area tecnica configurada para esta instancia DOM',
      );
    }

    return technicalArea.id;
  }

  private buildWhereFilter(filtros: FiltroUsuariosDto): Prisma.UsuarioWhereInput {
    const search = filtros.busqueda?.trim();
    const normalizedRut = normalizeRut(search);
    const rutFilter: Prisma.UsuarioWhereInput | undefined = search
      ? {
          rut: {
            contains: normalizedRut ?? search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : undefined;
    const matchingRoles = ['ENCARGADO', 'REEMPLAZO', 'TRABAJADOR'].filter(
      (role) => role.toLowerCase().includes(search?.toLowerCase() ?? ''),
    );

    return {
      ...(filtros.rol ? { rol: filtros.rol } : {}),
      ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
      ...(typeof filtros.activo === 'boolean'
        ? { activo: filtros.activo }
        : {}),
      ...(search
        ? {
            OR: [
              { nombres: { contains: search, mode: 'insensitive' } },
              { apellidos: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              ...(rutFilter ? [rutFilter] : []),
              ...(matchingRoles.length > 0
                ? [{ rol: { in: matchingRoles as never[] } }]
                : []),
              {
                area: {
                  nombre: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
  }
}
