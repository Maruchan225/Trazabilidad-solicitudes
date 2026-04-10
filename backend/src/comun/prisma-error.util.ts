import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown, entityName: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const campos = Array.isArray(error.meta?.target) ? error.meta.target : [];

    if (entityName === 'usuario' && campos.includes('email')) {
      throw new ConflictException('El correo ingresado ya esta registrado');
    }

    throw new ConflictException(
      `Se produjo un conflicto de unicidad al guardar ${entityName}`,
    );
  }

  throw error;
}
