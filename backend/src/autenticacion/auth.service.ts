import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { UsuarioToken } from './interfaces/usuario-token.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async iniciarSesion(loginDto: LoginDto) {
    const user = await this.usuariosService.buscarPorCorreo(loginDto.email);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await this.usuariosService.validarContrasena(
      loginDto.contrasena,
      user.contrasena,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload: UsuarioToken = {
      id: user.id,
      correo: user.email,
      rol: user.rol,
      areaId: user.areaId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        id: user.id,
        correo: user.email,
        rut: user.rut,
        rol: user.rol,
        areaId: user.areaId,
        nombres: user.nombres,
        apellidos: user.apellidos,
      },
    };
  }
}
