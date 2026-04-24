import type { Area } from '@/tipos/areas';
import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';
import type { TipoSolicitud } from '@/tipos/tiposSolicitud';
import type { Usuario } from '@/tipos/usuarios';

export type Solicitud = {
  id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoSolicitud;
  estadoActual: EstadoSolicitud;
  estadoPersistido: EstadoSolicitud;
  prioridad: PrioridadSolicitud;
  creadoEn: string;
  actualizadoEn: string;
  fechaVencimiento: string;
  fechaCierre?: string | null;
  estaVencida: boolean;
  creadoPor: Usuario;
  asignadoA?: Usuario | null;
  areaActual: Area;
  tipoSolicitud: TipoSolicitud;
};

export type HistorialSolicitud = {
  id: number;
  accion: string;
  comentario?: string | null;
  creadoEn: string;
  estadoOrigen?: EstadoSolicitud | null;
  estadoDestino?: EstadoSolicitud | null;
  usuario: Usuario;
  areaOrigen?: Area | null;
  areaDestino?: Area | null;
  asignadoOrigenId?: number | null;
  asignadoDestinoId?: number | null;
  asignadoOrigen?: Usuario | null;
  asignadoDestino?: Usuario | null;
};

export type SolicitudDetalle = Solicitud & {
  historialEntradas: HistorialSolicitud[];
};

export type SolicitudPayload = {
  titulo: string;
  descripcion: string;
  prioridad?: PrioridadSolicitud;
  asignadoAId?: number;
  areaActualId: number;
  tipoSolicitudId: number;
  comentario?: string;
};

export type AsignarSolicitudPayload = {
  asignadoAId: number;
  comentario?: string;
};

export type DerivarSolicitudPayload = {
  areaDestinoId: number;
  asignadoAId: number;
  comentario?: string;
};

export type CambiarEstadoSolicitudPayload = {
  estado: EstadoSolicitud;
  comentario?: string;
};

export type ComentarioSolicitudPayload = {
  comentario?: string;
};

export type ObservacionSolicitudPayload = {
  comentario: string;
};

export type Adjunto = {
  id: number;
  nombreOriginal: string;
  nombreArchivo: string;
  ruta: string;
  mimeType: string;
  tamano: number;
  creadoEn: string;
  solicitudId: number;
  subidoPorId?: number | null;
  subidoPor?: Usuario | null;
};
