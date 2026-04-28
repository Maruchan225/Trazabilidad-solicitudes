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
  getGeneralSummary(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getGeneralSummary(filters);
  }

  @Get('solicitudes-por-estado')
  getRequestsByStatus(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getRequestsByStatus(filters);
  }

  @Get('carga-por-trabajador')
  getWorkerLoad(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getWorkerLoad(filters);
  }

  @Get('tiempo-promedio-respuesta')
  getAverageResponseTime(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getAverageResponseTime(filters);
  }

  @Get('solicitudes-vencidas')
  getOverdueRequests(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getOverdueRequests(filters);
  }

  @Get('solicitudes-por-tipo')
  getRequestsByType(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getRequestsByType(filters);
  }

  @Get('solicitudes-por-prioridad')
  getRequestsByPriority(@Query() filters: FiltroReportesDto) {
    return this.reportesService.getRequestsByPriority(filters);
  }

  @Get('dashboard-trabajador')
  @Roles(RolUsuario.TRABAJADOR)
  getWorkerDashboard(@UsuarioAutenticado() usuario: UsuarioToken) {
    return this.reportesService.getWorkerDashboard(usuario);
  }
}
