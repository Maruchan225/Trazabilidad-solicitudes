import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAutenticado } from '../auth/decorators/usuario-autenticado.decorator';
import type { UsuarioToken } from '../auth/interfaces/usuario-token.interface';
import { AgregarObservacionSolicitudDto } from './dto/agregar-observacion-solicitud.dto';
import { AsignarSolicitudDto } from './dto/asignar-solicitud.dto';
import { CambiarEstadoSolicitudDto } from './dto/cambiar-estado-solicitud.dto';
import { CerrarSolicitudDto } from './dto/cerrar-solicitud.dto';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { DerivarSolicitudDto } from './dto/derivar-solicitud.dto';
import { FinalizarSolicitudDto } from './dto/finalizar-solicitud.dto';
import { SolicitudesService } from './solicitudes.service';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  crear(
    @Body() createSolicitudDto: CreateSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.crear(createSolicitudDto, usuario);
  }

  @Get()
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  listar(@UsuarioAutenticado() usuario: UsuarioToken) {
    return this.solicitudesService.listar(usuario);
  }

  @Get(':id')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  verDetalle(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.verDetalle(id, usuario);
  }

  @Patch(':id/asignar')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  asignar(
    @Param('id', ParseIntPipe) id: number,
    @Body() asignarSolicitudDto: AsignarSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.asignarSolicitud(
      id,
      asignarSolicitudDto,
      usuario,
    );
  }

  @Patch(':id/derivar')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  derivar(
    @Param('id', ParseIntPipe) id: number,
    @Body() derivarSolicitudDto: DerivarSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.derivarSolicitudAArea(
      id,
      derivarSolicitudDto,
      usuario,
    );
  }

  @Patch(':id/estado')
  @Roles(RolUsuario.TRABAJADOR)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() cambiarEstadoSolicitudDto: CambiarEstadoSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.cambiarEstadoSolicitud(
      id,
      cambiarEstadoSolicitudDto,
      usuario,
    );
  }

  @Post(':id/observaciones')
  @Roles(RolUsuario.TRABAJADOR)
  agregarObservacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() agregarObservacionSolicitudDto: AgregarObservacionSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.agregarObservacion(
      id,
      agregarObservacionSolicitudDto,
      usuario,
    );
  }

  @Patch(':id/finalizar')
  @Roles(RolUsuario.TRABAJADOR)
  finalizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() finalizarSolicitudDto: FinalizarSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.finalizarSolicitud(
      id,
      finalizarSolicitudDto,
      usuario,
    );
  }

  @Patch(':id/cerrar')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() cerrarSolicitudDto: CerrarSolicitudDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.cerrarSolicitud(
      id,
      cerrarSolicitudDto,
      usuario,
    );
  }
}
