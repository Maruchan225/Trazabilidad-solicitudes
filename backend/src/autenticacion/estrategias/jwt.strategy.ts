import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { UsuarioToken } from '../interfaces/usuario-token.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: UsuarioToken): Promise<UsuarioToken> {
    const usuario =
      await this.usuariosService.buscarContextoAutenticacionPorId(payload.id);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Sesion invalida o expirada');
    }

    return {
      id: usuario.id,
      correo: usuario.email,
      rol: usuario.rol,
      areaId: usuario.areaId,
    };
  }
}
