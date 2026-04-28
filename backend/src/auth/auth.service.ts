import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from './current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h') as never });

    return { accessToken, user: this.sanitizeUser(user) };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.enabled) throw new UnauthorizedException('Invalid credentials');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async getCurrentUser(user: AuthenticatedUser) {
    const currentUser = await this.prisma.user.findUnique({ where: { id: user.sub } });
    if (!currentUser?.enabled) throw new UnauthorizedException('User is disabled');
    return this.sanitizeUser(currentUser);
  }

  sanitizeUser(user: User) {
    const { passwordHash: _passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
