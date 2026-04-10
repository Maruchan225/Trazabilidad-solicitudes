import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestAutenticado } from '../interfaces/request-autenticado.interface';
import { UsuarioToken } from '../interfaces/usuario-token.interface';

export const UsuarioAutenticado = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioToken => {
    const request = ctx.switchToHttp().getRequest<RequestAutenticado>();
    return request.user as UsuarioToken;
  },
);
