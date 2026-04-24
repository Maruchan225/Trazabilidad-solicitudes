import { Prisma } from '@prisma/client';

export const USUARIO_PUBLICO_ARGS = {
  omit: {
    contrasena: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;

export const USUARIO_PUBLICO_CON_AREA_ARGS = {
  omit: {
    contrasena: true,
  },
  include: {
    area: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;
