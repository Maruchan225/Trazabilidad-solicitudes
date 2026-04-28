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
    const data = { ...dto, email: this.normalizeEmail(dto.email), rut: this.formatRut(dto.rut) };
    const exists = await this.prisma.user.findFirst({ where: { OR: [{ email: data.email }, { rut: data.rut }] } });
    if (exists?.email === data.email) throw new ConflictException('El correo ya esta registrado');
    if (exists?.rut === data.rut) throw new ConflictException('El RUT ya esta registrado');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({ data: { name: data.name, rut: data.rut, email: data.email, passwordHash, role: data.role, enabled: data.enabled ?? true }, select: this.safeUserSelect() });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const data = {
      ...dto,
      email: dto.email ? this.normalizeEmail(dto.email) : undefined,
      rut: dto.rut ? this.formatRut(dto.rut) : undefined,
    };
    if (data.email || data.rut) {
      const duplicatedUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [{ email: data.email }, { rut: data.rut }].filter((item) => Object.values(item)[0] !== undefined)
        }
      });
      if (duplicatedUser?.email === data.email) throw new ConflictException('El correo ya esta registrado');
      if (duplicatedUser?.rut === data.rut) throw new ConflictException('El RUT ya esta registrado');
    }
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    return this.prisma.user.update({ where: { id }, data: { name: data.name, rut: data.rut, email: data.email, role: data.role, enabled: data.enabled, passwordHash }, select: this.safeUserSelect() });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private formatRut(rut: string) {
    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length < 2) return cleanRut;

    const body = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${verifier}`;
  }

  private safeUserSelect() {
    return { id: true, name: true, rut: true, email: true, role: true, enabled: true, createdAt: true, updatedAt: true };
  }
}
