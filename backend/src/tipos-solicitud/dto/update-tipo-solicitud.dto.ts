import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoSolicitudDto } from './create-tipo-solicitud.dto';

export class UpdateTipoSolicitudDto extends PartialType(
  CreateTipoSolicitudDto,
) {}
