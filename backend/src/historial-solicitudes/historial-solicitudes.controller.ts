import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAutenticado } from '../auth/decorators/usuario-autenticado.decorator';
import type { UsuarioToken } from '../auth/interfaces/usuario-token.interface';
import { HistorialSolicitudesService } from './historial-solicitudes.service';

@Controller('historial-solicitudes')
export class HistorialSolicitudesController {
  constructor(
    private readonly historialSolicitudesService: HistorialSolicitudesService,
  ) {}

  @Get()
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  listar() {
    return this.historialSolicitudesService.listar();
  }

  @Get('solicitud/:solicitudId')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  listarPorSolicitud(
    @Param('solicitudId', ParseIntPipe) solicitudId: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.historialSolicitudesService.listarPorSolicitud(
      solicitudId,
      usuario,
    );
  }
}
