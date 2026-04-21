import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { RolUsuario } from '@prisma/client';
import { FiltroPaginacionDto } from '../../comun/dto/filtro-paginacion.dto';

export class FiltroUsuariosDto extends FiltroPaginacionDto {
  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Number(value)))
  @IsInt()
  areaId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return value;
  })
  @IsBoolean()
  activo?: boolean;
}
