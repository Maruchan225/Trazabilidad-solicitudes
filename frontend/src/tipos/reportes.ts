import type { PrioridadSolicitud } from '@/tipos/comun';
import type { EstadoSolicitud } from '@/tipos/comun';

export type FiltrosReportes = {
  fechaDesde?: string;
  fechaHasta?: string;
  trabajadorId?: number;
  tipoSolicitudId?: number;
};

export type ResumenGeneral = {
  totalSolicitudes: number;
  solicitudesIngresadas: number;
  solicitudesEnProceso: number;
  solicitudesFinalizadas: number;
  solicitudesCerradas: number;
  solicitudesVencidas: number;
  solicitudesProximasAVencer: number;
};

export type SolicitudesPorEstado = {
  items: Array<{
    estado: EstadoSolicitud;
    cantidad: number;
  }>;
  totalVencidasCalculadas: number;
};

export type CargaPorTrabajador = {
  trabajadorId: number;
  nombreCompleto: string;
  totalAsignadas: number;
  enProceso: number;
  pendientesInformacion: number;
  finalizadas: number;
  cerradas: number;
  vencidas: number;
};

export type TiempoPromedioRespuesta = {
  totalSolicitudesCerradas: number;
  tiempoPromedioHoras: number;
  tiempoPromedioDias: number;
};

export type SolicitudVencidaReporte = {
  id: number;
  correlativo: number;
  /** Compatibilidad temporal: referencia externa heredada, no identificador principal visible. */
  numeroSolicitud?: string | null;
  titulo: string;
  estado: EstadoSolicitud;
  fechaVencimiento: string;
  diasAtraso: number;
  tipoSolicitudId: number;
  tipoSolicitud: string;
  asignadoAId?: number | null;
  asignadoA?: string | null;
};

export type SolicitudesPorTipo = {
  tipoSolicitudId: number;
  tipoSolicitud: string;
  cantidad: number;
};

export type SolicitudesPorPrioridad = {
  prioridad: PrioridadSolicitud;
  cantidad: number;
};

export type DashboardTrabajador = {
  solicitudesNuevas: number;
  solicitudesEnProceso: number;
  solicitudesCerradas: number;
  solicitudesPorVencer: number;
  solicitudesVencidas: number;
  solicitudesACargo: number;
};
