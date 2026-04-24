import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RolUsuario } from '@prisma/client';
import { normalizeRutInput } from '../../comun/rut.util';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombres: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  apellidos: string;

  @Transform(({ value }) => normalizeRutInput(value))
  @Matches(/^\d{7,8}-[\dK]$/, {
    message: 'El rut debe tener formato 12345678-9',
  })
  rut: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  contrasena: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @IsOptional()
  @IsInt()
  areaId?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
