import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EstadoSolicitud, PrioridadSolicitud } from '@prisma/client';
import { FiltroPaginacionDto } from '../../comun/dto/filtro-paginacion.dto';

export class FiltroSolicitudesDto extends FiltroPaginacionDto {
  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @IsOptional()
  @IsEnum(PrioridadSolicitud)
  prioridad?: PrioridadSolicitud;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Number(value)))
  @IsInt()
  areaId?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Number(value)))
  @IsInt()
  tipoSolicitudId?: number;
}
