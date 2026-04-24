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

    if (entityName === 'usuario' && campos.includes('rut')) {
      throw new ConflictException('El rut ingresado ya esta registrado');
    }

    if (entityName === 'solicitud' && campos.includes('numeroSolicitud')) {
      throw new ConflictException(
        'La referencia externa ingresada ya esta registrada',
      );
    }

    if (entityName === 'solicitud' && campos.includes('correlativo')) {
      throw new ConflictException(
        'No fue posible generar un correlativo unico para la solicitud',
      );
    }

    throw new ConflictException(
      `Se produjo un conflicto de unicidad al guardar ${entityName}`,
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  ) {
    if (entityName === 'usuario') {
      throw new ConflictException(
        'No se puede eliminar el usuario porque tiene registros asociados',
      );
    }

    if (entityName === 'area') {
      throw new ConflictException(
        'No se puede eliminar el area porque tiene registros asociados',
      );
    }

    if (entityName === 'tipo de solicitud') {
      throw new ConflictException(
        'No se puede eliminar el tipo de solicitud porque tiene solicitudes asociadas',
      );
    }

    throw new ConflictException(
      `No se puede eliminar ${entityName} porque tiene registros asociados`,
    );
  }

  throw error;
}
