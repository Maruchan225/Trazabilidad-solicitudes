import { Tag } from 'antd';
import { obtenerColorActivo } from '@/utilidades/estadoVisual';

type TagActivoProps = {
  activo: boolean;
  textoActivo?: string;
  textoInactivo?: string;
};

export function TagActivo({
  activo,
  textoActivo = 'Activo',
  textoInactivo = 'Inactivo',
}: TagActivoProps) {
  return (
    <Tag color={obtenerColorActivo(activo)}>
      {activo ? textoActivo : textoInactivo}
    </Tag>
  );
}
