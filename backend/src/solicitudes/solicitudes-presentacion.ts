import { EstadoSolicitud } from '@prisma/client';

export type SolicitudPresentable = {
  estado: EstadoSolicitud;
  fechaVencimiento: Date;
  fechaCierre: Date | null;
};

export function estaSolicitudVencida(solicitud: SolicitudPresentable) {
  const estaTerminada =
    solicitud.fechaCierre || solicitud.estado === EstadoSolicitud.FINALIZADA || solicitud.estado === EstadoSolicitud.CERRADA;
  return !estaTerminada && solicitud.fechaVencimiento.getTime() < Date.now();
}

export function presentarSolicitud<T extends SolicitudPresentable>(solicitud: T) {
  const estaVencida = estaSolicitudVencida(solicitud);

  return {
    ...solicitud,
    estadoPersistido: solicitud.estado,
    estadoActual: estaVencida ? EstadoSolicitud.VENCIDA : solicitud.estado,
    estaVencida,
  };
}
