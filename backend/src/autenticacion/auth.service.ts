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
    const usuario = await this.usuariosService.buscarPorCorreo(loginDto.email);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const contrasenaValida = await this.usuariosService.validarContrasena(
      loginDto.contrasena,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload: UsuarioToken = {
      id: usuario.id,
      correo: usuario.email,
      rol: usuario.rol,
      areaId: usuario.areaId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        id: usuario.id,
        correo: usuario.email,
        rut: usuario.rut,
        rol: usuario.rol,
        areaId: usuario.areaId,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
      },
    };
  }
}
