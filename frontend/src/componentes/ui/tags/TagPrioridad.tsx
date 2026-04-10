import { Tag } from 'antd';
import type { PrioridadSolicitud } from '@/tipos/comun';
import { obtenerColorPrioridad } from '@/utilidades/estadoVisual';

type TagPrioridadProps = {
  prioridad: PrioridadSolicitud;
};

export function TagPrioridad({ prioridad }: TagPrioridadProps) {
  return <Tag color={obtenerColorPrioridad(prioridad)}>{prioridad}</Tag>;
}
