import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class AsignarSolicitudDto {
  @IsInt()
  asignadoAId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
