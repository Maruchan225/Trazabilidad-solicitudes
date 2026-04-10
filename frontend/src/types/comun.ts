export type RolUsuario = 'ENCARGADO' | 'REEMPLAZO' | 'TRABAJADOR';

export type EstadoSolicitud =
  | 'INGRESADA'
  | 'DERIVADA'
  | 'EN_PROCESO'
  | 'PENDIENTE_INFORMACION'
  | 'FINALIZADA'
  | 'CERRADA'
  | 'VENCIDA';

export type PrioridadSolicitud = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
