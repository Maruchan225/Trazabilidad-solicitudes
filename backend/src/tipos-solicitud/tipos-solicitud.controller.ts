import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { CreateTipoSolicitudDto as CreateRequestTypeDto } from './dto/create-tipo-solicitud.dto';
import { UpdateTipoSolicitudDto as UpdateRequestTypeDto } from './dto/update-tipo-solicitud.dto';
import { TiposSolicitudService } from './tipos-solicitud.service';

@Controller('tipos-solicitud')
@Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
export class TiposSolicitudController {
  constructor(private readonly tiposSolicitudService: TiposSolicitudService) {}

  @Post()
  create(@Body() createRequestTypeDto: CreateRequestTypeDto) {
    return this.tiposSolicitudService.create(createRequestTypeDto);
  }

  @Get()
  list() {
    return this.tiposSolicitudService.list();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.tiposSolicitudService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestTypeDto: UpdateRequestTypeDto,
  ) {
    return this.tiposSolicitudService.update(id, updateRequestTypeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposSolicitudService.remove(id);
  }
}
