import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class FiltroReportesDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trabajadorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipoSolicitudId?: number;
}
