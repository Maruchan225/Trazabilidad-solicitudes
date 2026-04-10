import { IsString, MaxLength, MinLength } from 'class-validator';

export class AgregarObservacionSolicitudDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  comentario: string;
}
