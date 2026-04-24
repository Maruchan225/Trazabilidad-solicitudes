import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';

export const COLOR_SEMAFORO_VERDE = '#10b981';
export const COLOR_SEMAFORO_AMARILLO = '#f59e0b';
export const COLOR_SEMAFORO_ROJO = '#ef4444';

export function obtenerColorActivo(activo: boolean) {
  return activo ? COLOR_SEMAFORO_VERDE : '#94a3b8';
}

export function obtenerColorSemaforo(semaforo: 'verde' | 'amarillo' | 'rojo') {
  switch (semaforo) {
    case 'verde':
      return COLOR_SEMAFORO_VERDE;
    case 'amarillo':
      return COLOR_SEMAFORO_AMARILLO;
    case 'rojo':
      return COLOR_SEMAFORO_ROJO;
    default:
      return COLOR_SEMAFORO_AMARILLO;
  }
}

export function obtenerSemaforoVencimiento({
  fechaVencimiento,
  fechaCierre,
  estaVencida = false,
  diasAdvertencia = 3,
}: {
  fechaVencimiento?: string | null;
  fechaCierre?: string | null;
  estaVencida?: boolean;
  diasAdvertencia?: number;
}) {
  if (estaVencida) {
    return 'rojo' as const;
  }

  if (fechaCierre) {
    return 'verde' as const;
  }

  const vencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

  if (!vencimiento || Number.isNaN(vencimiento.getTime())) {
    return 'amarillo' as const;
  }

  const ahora = new Date();

  if (vencimiento < ahora) {
    return 'rojo' as const;
  }

  const limiteAdvertencia = new Date();
  limiteAdvertencia.setDate(limiteAdvertencia.getDate() + diasAdvertencia);

  if (vencimiento <= limiteAdvertencia) {
    return 'amarillo' as const;
  }

  return 'verde' as const;
}

export function obtenerColorEstadoSolicitud(
  estado: EstadoSolicitud,
  estaVencida?: boolean,
) {
  if (estaVencida || estado === 'VENCIDA') {
    return COLOR_SEMAFORO_ROJO;
  }

  switch (estado) {
    case 'INGRESADA':
    case 'DERIVADA':
    case 'EN_PROCESO':
    case 'PENDIENTE_INFORMACION':
      return COLOR_SEMAFORO_AMARILLO;
    case 'FINALIZADA':
    case 'CERRADA':
      return COLOR_SEMAFORO_VERDE;
    default:
      return COLOR_SEMAFORO_AMARILLO;
  }
}

export function obtenerColorPrioridad(prioridad: PrioridadSolicitud) {
  switch (prioridad) {
    case 'BAJA':
      return COLOR_SEMAFORO_VERDE;
    case 'MEDIA':
      return COLOR_SEMAFORO_AMARILLO;
    case 'ALTA':
    case 'URGENTE':
      return COLOR_SEMAFORO_ROJO;
    default:
      return COLOR_SEMAFORO_AMARILLO;
  }
}
