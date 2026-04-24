import type { PrioridadSolicitud } from '@/tipos/comun';
import type { Solicitud } from '@/tipos/solicitudes';

const MILISEGUNDOS_POR_DIA = 1000 * 60 * 60 * 24;

function convertirFecha(valor?: string | null) {
  if (!valor) {
    return null;
  }

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function calcularDiasHastaVencimiento(
  fechaVencimiento?: string | null,
  fechaCierre?: string | null,
) {
  if (fechaCierre) {
    return null;
  }

  const fecha = convertirFecha(fechaVencimiento);

  if (!fecha) {
    return null;
  }

  return Math.ceil((fecha.getTime() - Date.now()) / MILISEGUNDOS_POR_DIA);
}

export function obtenerEtiquetaVencimiento(
  fechaVencimiento?: string | null,
  fechaCierre?: string | null,
  estaVencida = false,
) {
  const dias = calcularDiasHastaVencimiento(fechaVencimiento, fechaCierre);

  if (estaVencida || (typeof dias === 'number' && dias < 0)) {
    const atraso = Math.abs(dias ?? 0);
    return atraso <= 1 ? 'Vencida' : `Vencida hace ${atraso} dias`;
  }

  if (fechaCierre) {
    return 'Cerrada en plazo';
  }

  if (dias === null) {
    return 'Seguimiento requerido';
  }

  if (dias === 0) {
    return 'Vence hoy';
  }

  if (dias <= 3) {
    return `Vence en ${dias} dia${dias === 1 ? '' : 's'}`;
  }

  return 'En plazo';
}

function obtenerPesoPrioridad(prioridad: PrioridadSolicitud) {
  switch (prioridad) {
    case 'URGENTE':
      return 4;
    case 'ALTA':
      return 3;
    case 'MEDIA':
      return 2;
    case 'BAJA':
      return 1;
    default:
      return 0;
  }
}

export function ordenarSolicitudesPorUrgencia(solicitudes: Solicitud[]) {
  return [...solicitudes].sort((a, b) => {
    const aDias = calcularDiasHastaVencimiento(a.fechaVencimiento, a.fechaCierre);
    const bDias = calcularDiasHastaVencimiento(b.fechaVencimiento, b.fechaCierre);

    const aVencida = a.estaVencida || (typeof aDias === 'number' && aDias < 0);
    const bVencida = b.estaVencida || (typeof bDias === 'number' && bDias < 0);

    if (aVencida !== bVencida) {
      return aVencida ? -1 : 1;
    }

    const aPorVencer = typeof aDias === 'number' && aDias >= 0 && aDias <= 3;
    const bPorVencer = typeof bDias === 'number' && bDias >= 0 && bDias <= 3;

    if (aPorVencer !== bPorVencer) {
      return aPorVencer ? -1 : 1;
    }

    const diferenciaPrioridad =
      obtenerPesoPrioridad(b.prioridad) - obtenerPesoPrioridad(a.prioridad);

    if (diferenciaPrioridad !== 0) {
      return diferenciaPrioridad;
    }

    const tiempoA = convertirFecha(a.fechaVencimiento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const tiempoB = convertirFecha(b.fechaVencimiento)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (tiempoA !== tiempoB) {
      return tiempoA - tiempoB;
    }

    return b.id - a.id;
  });
}
