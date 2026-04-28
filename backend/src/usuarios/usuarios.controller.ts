import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { CreateUsuarioDto as CreateUserDto } from './dto/create-usuario.dto';
import { FiltroUsuariosDto } from './dto/filtro-usuarios.dto';
import { UpdateUsuarioDto as UpdateUserDto } from './dto/update-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usuariosService.create(createUserDto);
  }

  @Get()
  list(@Query() filters: FiltroUsuariosDto) {
    return this.usuariosService.list(filters);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usuariosService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
