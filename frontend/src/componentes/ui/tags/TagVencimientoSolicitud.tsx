import { Tag } from 'antd';
import { obtenerColorSemaforo, obtenerSemaforoVencimiento } from '@/utilidades/estadoVisual';
import { obtenerEtiquetaVencimiento } from '@/utilidades/solicitudesOperativas';

type TagVencimientoSolicitudProps = {
  fechaVencimiento?: string | null;
  fechaCierre?: string | null;
  estaVencida?: boolean;
};

export function TagVencimientoSolicitud({
  fechaVencimiento,
  fechaCierre,
  estaVencida = false,
}: TagVencimientoSolicitudProps) {
  const semaforo = obtenerSemaforoVencimiento({
    fechaVencimiento,
    fechaCierre,
    estaVencida,
  });

  const etiqueta = obtenerEtiquetaVencimiento(
    fechaVencimiento,
    fechaCierre,
    estaVencida,
  );

  return <Tag color={obtenerColorSemaforo(semaforo)}>{etiqueta}</Tag>;
}
