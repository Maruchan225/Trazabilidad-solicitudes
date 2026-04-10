import type { EstadoSolicitud } from '@/types/comun';

export type FiltrosReportes = {
  fechaDesde?: string;
  fechaHasta?: string;
  areaId?: number;
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
  areaId: number;
  area: string;
  totalAsignadas: number;
  enProceso: number;
  pendientesInformacion: number;
  finalizadas: number;
  cerradas: number;
  vencidas: number;
};

export type SolicitudesPorArea = {
  areaId: number;
  area: string;
  cantidad: number;
};

export type TiempoPromedioRespuesta = {
  totalSolicitudesCerradas: number;
  tiempoPromedioHoras: number;
  tiempoPromedioDias: number;
};

export type SolicitudVencidaReporte = {
  id: number;
  titulo: string;
  estado: EstadoSolicitud;
  fechaVencimiento: string;
  diasAtraso: number;
  areaId: number;
  area: string;
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
