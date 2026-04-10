export type TipoSolicitud = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  diasSla?: number | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
};

export type TipoSolicitudPayload = {
  nombre: string;
  descripcion?: string;
  diasSla?: number;
  activo?: boolean;
};
