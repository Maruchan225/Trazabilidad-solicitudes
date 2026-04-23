import { Tag } from 'antd';
import type { EstadoSolicitud } from '@/tipos/comun';
import { obtenerColorEstadoSolicitud } from '@/utilidades/estadoVisual';
import { formatearEstado } from '@/utilidades/reportes';

type TagEstadoSolicitudProps = {
  estado: EstadoSolicitud;
  estaVencida?: boolean;
};

export function TagEstadoSolicitud({
  estado,
  estaVencida = false,
}: TagEstadoSolicitudProps) {
  return (
    <Tag color={obtenerColorEstadoSolicitud(estado, estaVencida)}>
      {formatearEstado(estado)}
    </Tag>
  );
}
