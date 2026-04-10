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
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTipoSolicitudDto } from './dto/create-tipo-solicitud.dto';
import { UpdateTipoSolicitudDto } from './dto/update-tipo-solicitud.dto';
import { TiposSolicitudService } from './tipos-solicitud.service';

@Controller('tipos-solicitud')
@Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
export class TiposSolicitudController {
  constructor(private readonly tiposSolicitudService: TiposSolicitudService) {}

  @Post()
  crear(@Body() createTipoSolicitudDto: CreateTipoSolicitudDto) {
    return this.tiposSolicitudService.crear(createTipoSolicitudDto);
  }

  @Get()
  listar() {
    return this.tiposSolicitudService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.tiposSolicitudService.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTipoSolicitudDto: UpdateTipoSolicitudDto,
  ) {
    return this.tiposSolicitudService.actualizar(id, updateTipoSolicitudDto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.tiposSolicitudService.eliminar(id);
  }
}
