import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CerrarSolicitudDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
