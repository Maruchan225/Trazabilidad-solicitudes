export type Area = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
};

export type AreaPayload = {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
};
