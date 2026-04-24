import { Controller, Get, Query } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/decoradores/usuario-autenticado.decorator';
import type { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { FiltroReportesDto } from './dto/filtro-reportes.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@Roles(RolUsuario.ENCARGADO, RolUsuario.REEMPLAZO)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen-general')
  obtenerResumenGeneral(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerResumenGeneral(filtros);
  }

  @Get('solicitudes-por-estado')
  obtenerSolicitudesPorEstado(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerSolicitudesPorEstado(filtros);
  }

  @Get('carga-por-trabajador')
  obtenerCargaPorTrabajador(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerCargaPorTrabajador(filtros);
  }

  @Get('tiempo-promedio-respuesta')
  obtenerTiempoPromedioRespuesta(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerTiempoPromedioRespuesta(filtros);
  }

  @Get('solicitudes-vencidas')
  obtenerSolicitudesVencidas(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerSolicitudesVencidas(filtros);
  }

  @Get('solicitudes-por-tipo')
  obtenerSolicitudesPorTipo(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerSolicitudesPorTipo(filtros);
  }

  @Get('solicitudes-por-prioridad')
  obtenerSolicitudesPorPrioridad(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerSolicitudesPorPrioridad(filtros);
  }

  @Get('dashboard-trabajador')
  @Roles(RolUsuario.TRABAJADOR)
  obtenerDashboardTrabajador(@UsuarioAutenticado() usuario: UsuarioToken) {
    return this.reportesService.obtenerDashboardTrabajador(usuario);
  }
}
