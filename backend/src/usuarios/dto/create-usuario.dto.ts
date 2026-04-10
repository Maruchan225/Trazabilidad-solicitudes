import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombres: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  apellidos: string;

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

  @IsInt()
  areaId: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
