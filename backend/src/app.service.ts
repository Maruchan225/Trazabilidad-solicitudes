import { Injectable } from '@nestjs/common';

export type EstadoAplicacion = {
  name: string;
  status: 'ok';
  modulo: string;
  fechaHora: string;
};

@Injectable()
export class AppService {
  obtenerEstado(): EstadoAplicacion {
    return {
      name: 'backend-trazabilidad-municipal',
      status: 'ok',
      modulo: 'trazabilidad-municipal',
      fechaHora: new Date().toISOString(),
    };
  }
}
