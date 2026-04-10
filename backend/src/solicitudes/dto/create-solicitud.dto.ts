import { PrioridadSolicitud } from '@prisma/client';
import {
  IsDateString,
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

  @IsDateString()
  fechaVencimiento: string;

  @IsOptional()
  @IsInt()
  asignadoAId?: number;

  @IsInt()
  areaActualId: number;

  @IsInt()
  tipoSolicitudId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
