import { CanalIngreso, PrioridadSolicitud } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSolicitudDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  titulo: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  descripcion: string;

  @IsOptional()
  @IsEnum(PrioridadSolicitud)
  prioridad?: PrioridadSolicitud;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  /** Compatibilidad temporal: referencia externa opcional, no identificador operativo principal. */
  numeroSolicitud?: string;

  @IsEnum(CanalIngreso)
  canalIngreso: CanalIngreso;

  @IsInt()
  asignadoAId: number;

  @IsInt()
  tipoSolicitudId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
