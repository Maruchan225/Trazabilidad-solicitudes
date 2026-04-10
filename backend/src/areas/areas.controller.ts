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
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Controller('areas')
@Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  crear(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.crear(createAreaDto);
  }

  @Get()
  listar() {
    return this.areasService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaDto: UpdateAreaDto,
  ) {
    return this.areasService.actualizar(id, updateAreaDto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.eliminar(id);
  }
}
