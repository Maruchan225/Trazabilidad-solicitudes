import { EstadoSolicitud } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CambiarEstadoSolicitudDto {
  @IsEnum(EstadoSolicitud)
  estado: EstadoSolicitud;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
