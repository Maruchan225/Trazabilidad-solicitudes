import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtSecret } from '../config/environment';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService)
    });
  }

  async validate(payload: { sub: string; email: string; role: UserRole }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.enabled) throw new UnauthorizedException('User is disabled');
    return { sub: user.id, email: user.email, role: user.role };
  }
}
