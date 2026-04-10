import { Module } from '@nestjs/common';
import { HistorialSolicitudesController } from './historial-solicitudes.controller';
import { HistorialSolicitudesService } from './historial-solicitudes.service';

@Module({
  controllers: [HistorialSolicitudesController],
  providers: [HistorialSolicitudesService],
  exports: [HistorialSolicitudesService],
})
export class HistorialSolicitudesModule {}
