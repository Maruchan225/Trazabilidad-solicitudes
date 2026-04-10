import type { Request } from 'express';
import type { UsuarioToken } from './usuario-token.interface';

export type RequestAutenticado = Request & {
  user?: UsuarioToken;
};
