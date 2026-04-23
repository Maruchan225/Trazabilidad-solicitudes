import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';

export function obtenerColorActivo(activo: boolean) {
  return activo ? '#10b981' : '#94a3b8'; // Verde si activo, gris si no
}

export function obtenerColorEstadoSolicitud(
  estado: EstadoSolicitud,
  estaVencida?: boolean,
) {
  // ROJO: Riesgo o Urgencia
  if (estaVencida || estado === 'VENCIDA') {
    return '#ef4444';
  }

  switch (estado) {
    // AMARILLO: En proceso / Pendientes
    case 'INGRESADA':
    case 'DERIVADA':
    case 'EN_PROCESO':
    case 'PENDIENTE_INFORMACION':
      return '#f59e0b';
    
    // VERDE: Finalizado / Cerrado
    case 'FINALIZADA':
    case 'CERRADA':
      return '#10b981';
      
    default:
      return '#94a3b8'; // Gris por defecto
  }
}

export function obtenerColorPrioridad(prioridad: PrioridadSolicitud) {
  switch (prioridad) {
    case 'BAJA':
      return '#10b981'; // Verde (Bajo riesgo)
    case 'MEDIA':
      return '#f59e0b'; // Amarillo
    case 'ALTA':
    case 'URGENTE':
      return '#ef4444'; // Rojo (Alto riesgo)
    default:
      return '#94a3b8';
  }
}
