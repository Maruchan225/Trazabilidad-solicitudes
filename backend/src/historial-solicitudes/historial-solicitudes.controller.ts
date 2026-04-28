import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/decoradores/usuario-autenticado.decorator';
import type { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { HistorialSolicitudesService } from './historial-solicitudes.service';

@Controller('historial-solicitudes')
export class HistorialSolicitudesController {
  constructor(
    private readonly historialSolicitudesService: HistorialSolicitudesService,
  ) {}

  @Get()
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
  list() {
    return this.historialSolicitudesService.list();
  }

  @Get('solicitud/:solicitudId')
  @Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO, RolUsuario.TRABAJADOR)
  listByRequest(
    @Param('solicitudId', ParseIntPipe) solicitudId: number,
    @UsuarioAutenticado() usuario: UsuarioToken,
  ) {
    return this.historialSolicitudesService.listByRequest(
      solicitudId,
      usuario,
    );
  }
}
