import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class DerivarSolicitudDto {
  @IsInt()
  areaDestinoId: number;

  @IsInt()
  asignadoAId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
