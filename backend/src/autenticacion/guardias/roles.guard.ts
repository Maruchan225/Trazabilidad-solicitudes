import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decoradores/roles.decorator';
import { RequestAutenticado } from '../interfaces/request-autenticado.interface';
import { UsuarioToken } from '../interfaces/usuario-token.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestAutenticado>();
    const user: UsuarioToken | undefined = request.user;

    if (!user) {
      return false;
    }

    if (!requiredRoles.includes(user.rol)) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a este recurso',
      );
    }

    return true;
  }
}
