import { Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../comun/prisma-error.util';
import { normalizeRut } from '../comun/rut.util';
import { CreateUsuarioDto as CreateUserDto } from './dto/create-usuario.dto';
import { FiltroUsuariosDto } from './dto/filtro-usuarios.dto';
import { UpdateUsuarioDto as UpdateUserDto } from './dto/update-usuario.dto';

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

  async create(createUserDto: CreateUserDto) {
    const areaId = await this.resolveTechnicalAreaId(createUserDto.areaId);

    try {
      const hashedPassword = await this.hashPassword(
        createUserDto.contrasena,
      );

      const user = await this.prisma.usuario.create({
        data: {
          ...createUserDto,
          areaId,
          rut: normalizeRut(createUserDto.rut) ?? createUserDto.rut,
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

  async list(filters: FiltroUsuariosDto) {
    const where = this.buildWhereFilter(filters);
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
      ...(typeof filters.offset === 'number' ? { skip: filters.offset } : {}),
      ...(typeof filters.limite === 'number' ? { take: filters.limite } : {}),
    });

    return users.map((user) => this.mapUserWithTotals(user));
  }

  async findById(id: number) {
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

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findById(id);

    if (updateUserDto.areaId) {
      await this.ensureAreaExists(updateUserDto.areaId);
    }

    try {
      const data = updateUserDto.contrasena
        ? {
            ...updateUserDto,
            ...(updateUserDto.rut
              ? {
                  rut: normalizeRut(updateUserDto.rut) ?? updateUserDto.rut,
                }
              : {}),
            contrasena: await this.hashPassword(updateUserDto.contrasena),
          }
        : {
            ...updateUserDto,
            ...(updateUserDto.rut
              ? {
                  rut: normalizeRut(updateUserDto.rut) ?? updateUserDto.rut,
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

  async remove(id: number) {
    await this.findById(id);

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

  async ensureExists(id: number) {
    return this.findById(id);
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        area: true,
      },
    });
  }

  findAuthContextById(id: number) {
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

  validatePassword(
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

  private buildWhereFilter(filters: FiltroUsuariosDto): Prisma.UsuarioWhereInput {
    const search = filters.busqueda?.trim();
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
      ...(filters.rol ? { rol: filters.rol } : {}),
      ...(filters.areaId ? { areaId: filters.areaId } : {}),
      ...(typeof filters.activo === 'boolean'
        ? { activo: filters.activo }
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
