import { Module } from '@nestjs/common';
import { TiposSolicitudController } from './tipos-solicitud.controller';
import { TiposSolicitudService } from './tipos-solicitud.service';

@Module({
  controllers: [TiposSolicitudController],
  providers: [TiposSolicitudService],
  exports: [TiposSolicitudService],
})
export class TiposSolicitudModule {}
