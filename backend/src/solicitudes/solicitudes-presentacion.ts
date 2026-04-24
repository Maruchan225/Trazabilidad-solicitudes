import { EstadoSolicitud } from '@prisma/client';

export type SolicitudPresentable = {
  estado: EstadoSolicitud;
  fechaVencimiento: Date;
  fechaCierre: Date | null;
};

export function isRequestOverdue(request: SolicitudPresentable) {
  return !request.fechaCierre && request.fechaVencimiento.getTime() < Date.now();
}

export function presentRequest<T extends SolicitudPresentable>(request: T) {
  const isOverdue = isRequestOverdue(request);

  return {
    ...request,
    estadoPersistido: request.estado,
    estadoActual: isOverdue ? EstadoSolicitud.VENCIDA : request.estado,
    estaVencida: isOverdue,
  };
}
