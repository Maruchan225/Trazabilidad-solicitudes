import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';

export function obtenerColorActivo(activo: boolean) {
  return activo ? '#4b5563' : 'default';
}

export function obtenerColorEstadoSolicitud(
  estado: EstadoSolicitud,
  estaVencida?: boolean,
) {
  if (estaVencida || estado === 'VENCIDA') {
    return '#111827';
  }

  switch (estado) {
    case 'INGRESADA':
      return '#9ca3af';
    case 'DERIVADA':
      return '#6b7280';
    case 'EN_PROCESO':
      return '#4b5563';
    case 'PENDIENTE_INFORMACION':
      return '#d1d5db';
    case 'FINALIZADA':
      return '#6b7280';
    case 'CERRADA':
      return '#374151';
    default:
      return 'default';
  }
}

export function obtenerColorPrioridad(prioridad: PrioridadSolicitud) {
  switch (prioridad) {
    case 'BAJA':
      return '#d1d5db';
    case 'MEDIA':
      return '#9ca3af';
    case 'ALTA':
      return '#6b7280';
    case 'URGENTE':
      return '#111827';
    default:
      return 'default';
  }
}
