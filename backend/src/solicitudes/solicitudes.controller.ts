import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/decoradores/usuario-autenticado.decorator';
import type { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { AgregarObservacionSolicitudDto as AddCommentDto } from './dto/agregar-observacion-solicitud.dto';
import { AsignarSolicitudDto as AssignRequestDto } from './dto/asignar-solicitud.dto';
import { CambiarEstadoSolicitudDto as ChangeStatusDto } from './dto/cambiar-estado-solicitud.dto';
import { CerrarSolicitudDto as CloseRequestDto } from './dto/cerrar-solicitud.dto';
import { CreateSolicitudDto as CreateRequestDto } from './dto/create-solicitud.dto';
import { DerivarSolicitudDto as TransferRequestDto } from './dto/derivar-solicitud.dto';
import { FiltroSolicitudesDto } from './dto/filtro-solicitudes.dto';
import { FinalizarSolicitudDto as FinalizeRequestDto } from './dto/finalizar-solicitud.dto';
import { SolicitudesService } from './solicitudes.service';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  create(
    @Body() createRequestDto: CreateRequestDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.create(createRequestDto, usuario);
  }

  @Get()
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  list(
    @UsuarioAutenticado() usuario: UsuarioToken,
    @Query() filters: FiltroSolicitudesDto,
  ) {
    return this.solicitudesService.list(usuario, filters);
  }

  @Get(':id')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  getDetails(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.getDetails(id, usuario);
  }

  @Patch(':id/asignar')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRequestDto: AssignRequestDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.assignRequest(
      id,
      assignRequestDto,
      usuario,
    );
  }

  @Patch(':id/derivar')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() transferRequestDto: TransferRequestDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.transferRequestToUser(
      id,
      transferRequestDto,
      usuario,
    );
  }

  @Patch(':id/estado')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeStatusDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.changeRequestStatus(
      id,
      changeStatusDto,
      usuario,
    );
  }

  @Post(':id/observaciones')
  @Roles(RolUsuario.TRABAJADOR)
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() addCommentDto: AddCommentDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.addComment(
      id,
      addCommentDto,
      usuario,
    );
  }

  @Patch(':id/finalizar')
  @Roles(RolUsuario.TRABAJADOR)
  finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() finalizeRequestDto: FinalizeRequestDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.finalizeRequest(
      id,
      finalizeRequestDto,
      usuario,
    );
  }

  @Patch(':id/cerrar')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeRequestDto: CloseRequestDto,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.solicitudesService.closeRequest(
      id,
      closeRequestDto,
      usuario,
    );
  }
}
