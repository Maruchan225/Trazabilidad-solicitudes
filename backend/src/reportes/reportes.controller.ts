import { Controller, Get, Query } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
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

  @Get('solicitudes-por-area')
  obtenerSolicitudesPorArea(@Query() filtros: FiltroReportesDto) {
    return this.reportesService.obtenerSolicitudesPorArea(filtros);
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
}
