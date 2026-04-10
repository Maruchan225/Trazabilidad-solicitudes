import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { EstadoAplicacion } from './app.service';
import { Publico } from './autenticacion/decoradores/publico.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Publico()
  obtenerEstado(): EstadoAplicacion {
    return this.appService.obtenerEstado();
  }
}
