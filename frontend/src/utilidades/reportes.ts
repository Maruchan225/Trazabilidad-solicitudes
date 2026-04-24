import type { ResumenGeneral, TiempoPromedioRespuesta } from '@/tipos/reportes';

export function formatearDias(valor: number) {
  return `${valor} dia${valor === 1 ? '' : 's'}`;
}

export function crearTarjetasResumenReportes(
  resumen?: ResumenGeneral | null,
  tiempoPromedio?: TiempoPromedioRespuesta | null,
) {
  return [
    {
      titulo: 'Total solicitudes',
      valor: resumen?.totalSolicitudes ?? 0,
    },
    {
      titulo: 'En proceso',
      valor: resumen?.solicitudesEnProceso ?? 0,
    },
    {
      titulo: 'Cerradas',
      valor: resumen?.solicitudesCerradas ?? 0,
    },
    {
      titulo: 'Proximas a vencer',
      valor: resumen?.solicitudesProximasAVencer ?? 0,
    },
    {
      titulo: 'Tiempo promedio',
      valor: `${tiempoPromedio?.tiempoPromedioDias ?? 0} dias`,
    },
  ];
}

export function obtenerTopPorCantidad<T>(
  items: T[],
  selectorCantidad: (item: T) => number,
  limite: number,
) {
  return [...items]
    .filter((item) => selectorCantidad(item) > 0)
    .sort((a, b) => selectorCantidad(b) - selectorCantidad(a))
    .slice(0, limite);
}

export function formatearEstado(estado: string): string {
  const mapeo: Record<string, string> = {
    INGRESADA: 'Ingresada',
    DERIVADA: 'Derivada',
    EN_PROCESO: 'En Proceso',
    PENDIENTE_INFORMACION: 'Pendiente de informacion',
    FINALIZADA: 'Finalizada',
    CERRADA: 'Cerrada',
    VENCIDA: 'Vencida',
  };

  return (
    mapeo[estado] ||
    estado
      .charAt(0)
      .toUpperCase() + estado.slice(1).toLowerCase().replace(/_/g, ' ')
  );
}
