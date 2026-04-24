import { Prisma } from '@prisma/client';

export const SAFE_USER_ARGS = {
  omit: {
    contrasena: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;

export const SAFE_USER_WITH_AREA_ARGS = {
  omit: {
    contrasena: true,
  },
  include: {
    area: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;
