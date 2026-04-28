import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAllUsers() {
    return this.prisma.user.findMany({ orderBy: { name: 'asc' }, select: this.safeUserSelect() });
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({ where: { OR: [{ email: dto.email }, { rut: dto.rut }] } });
    if (exists?.email === dto.email) throw new ConflictException('Email is already registered');
    if (exists?.rut === dto.rut) throw new ConflictException('RUT is already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({ data: { name: dto.name, rut: dto.rut, email: dto.email, passwordHash, role: dto.role, enabled: dto.enabled ?? true }, select: this.safeUserSelect() });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.email || dto.rut) {
      const duplicatedUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [{ email: dto.email }, { rut: dto.rut }].filter((item) => Object.values(item)[0] !== undefined)
        }
      });
      if (duplicatedUser?.email === dto.email) throw new ConflictException('Email is already registered');
      if (duplicatedUser?.rut === dto.rut) throw new ConflictException('RUT is already registered');
    }
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    return this.prisma.user.update({ where: { id }, data: { name: dto.name, rut: dto.rut, email: dto.email, role: dto.role, enabled: dto.enabled, passwordHash }, select: this.safeUserSelect() });
  }

  private safeUserSelect() {
    return { id: true, name: true, rut: true, email: true, role: true, enabled: true, createdAt: true, updatedAt: true };
  }
}
