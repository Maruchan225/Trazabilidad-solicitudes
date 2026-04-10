import type { Area } from '@/tipos/areas';
import type { EstadoSolicitud, PrioridadSolicitud, RolUsuario } from '@/tipos/comun';
import type { TipoSolicitud } from '@/tipos/tiposSolicitud';

type Opcion<T extends string | number> = {
  label: string;
  value: T;
};

export const OPCIONES_ROL_USUARIO: Opcion<RolUsuario>[] = [
  { label: 'Encargado', value: 'ENCARGADO' },
  { label: 'Reemplazo', value: 'REEMPLAZO' },
  { label: 'Trabajador', value: 'TRABAJADOR' },
];

export const OPCIONES_FILTRO_ROL_USUARIO: Opcion<RolUsuario>[] = [
  { label: 'ENCARGADO', value: 'ENCARGADO' },
  { label: 'REEMPLAZO', value: 'REEMPLAZO' },
  { label: 'TRABAJADOR', value: 'TRABAJADOR' },
];

export const OPCIONES_ESTADO_SOLICITUD: Opcion<EstadoSolicitud>[] = [
  { label: 'Ingresada', value: 'INGRESADA' },
  { label: 'Derivada', value: 'DERIVADA' },
  { label: 'En proceso', value: 'EN_PROCESO' },
  { label: 'Pendiente informacion', value: 'PENDIENTE_INFORMACION' },
  { label: 'Finalizada', value: 'FINALIZADA' },
  { label: 'Cerrada', value: 'CERRADA' },
  { label: 'Vencida', value: 'VENCIDA' },
];

export const OPCIONES_ESTADO_EDITABLE_SOLICITUD: Opcion<EstadoSolicitud>[] = [
  { label: 'Ingresada', value: 'INGRESADA' },
  { label: 'En proceso', value: 'EN_PROCESO' },
  { label: 'Pendiente informacion', value: 'PENDIENTE_INFORMACION' },
];

export const OPCIONES_PRIORIDAD_SOLICITUD: Opcion<PrioridadSolicitud>[] = [
  { label: 'Baja', value: 'BAJA' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Alta', value: 'ALTA' },
  { label: 'Urgente', value: 'URGENTE' },
];

export const OPCIONES_FILTRO_PRIORIDAD_SOLICITUD: Opcion<PrioridadSolicitud>[] = [
  { label: 'BAJA', value: 'BAJA' },
  { label: 'MEDIA', value: 'MEDIA' },
  { label: 'ALTA', value: 'ALTA' },
  { label: 'URGENTE', value: 'URGENTE' },
];

export const OPCIONES_ESTADO_ACTIVO = [
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
];

export function mapearOpcionesAreas(areas: Area[]) {
  return areas.map((area) => ({ label: area.nombre, value: area.id }));
}

export function mapearOpcionesTiposSolicitud(tipos: TipoSolicitud[]) {
  return tipos.map((tipo) => ({ label: tipo.nombre, value: tipo.id }));
}
