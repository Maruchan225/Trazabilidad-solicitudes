import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FinalizarSolicitudDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
