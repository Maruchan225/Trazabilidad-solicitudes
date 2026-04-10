import { Form, Input, Select, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { Area } from '@/tipos/areas';
import type { EstadoSolicitud } from '@/tipos/comun';
import type { Usuario } from '@/tipos/usuarios';
import {
  OPCIONES_ESTADO_EDITABLE_SOLICITUD,
  mapearOpcionesAreas,
} from '@/utilidades/opciones';

export type AccionSolicitud =
  | 'asignar'
  | 'derivar'
  | 'estado'
  | 'observacion'
  | 'finalizar'
  | 'cerrar';

export type FormularioAccionSolicitudValores = {
  asignadoAId?: number;
  areaDestinoId?: number;
  estado?: EstadoSolicitud;
  comentario?: string;
};

type FormularioAccionSolicitudProps = {
  accionActiva: AccionSolicitud | null;
  form: FormInstance<FormularioAccionSolicitudValores>;
  areasDisponibles: Area[];
  trabajadoresArea: Usuario[];
  trabajadoresAreaDestino: Usuario[];
  areaDestinoSeleccionada?: number;
  loadingAreas?: boolean;
  loadingUsuarios?: boolean;
  onFinish: (values: FormularioAccionSolicitudValores) => void;
};

export const TITULOS_ACCION_SOLICITUD: Record<AccionSolicitud, string> = {
  asignar: 'Asignar solicitud',
  derivar: 'Derivar solicitud',
  estado: 'Cambiar estado',
  observacion: 'Agregar observacion',
  finalizar: 'Finalizar solicitud',
  cerrar: 'Cerrar solicitud',
};

export function FormularioAccionSolicitud({
  accionActiva,
  form,
  areasDisponibles,
  trabajadoresArea,
  trabajadoresAreaDestino,
  areaDestinoSeleccionada,
  loadingAreas = false,
  loadingUsuarios = false,
  onFinish,
}: FormularioAccionSolicitudProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {accionActiva === 'asignar' ? (
        <Form.Item
          label="Trabajador"
          name="asignadoAId"
          rules={[{ required: true, message: 'Seleccione un trabajador' }]}
        >
          <Select
            loading={loadingUsuarios}
            options={trabajadoresArea.map((usuario) => ({
              label: `${usuario.nombres} ${usuario.apellidos}`,
              value: usuario.id,
            }))}
          />
        </Form.Item>
      ) : null}

      {accionActiva === 'derivar' ? (
        <Form.Item
          label="Area destino"
          name="areaDestinoId"
          rules={[{ required: true, message: 'Seleccione el area destino' }]}
        >
          <Select
            loading={loadingAreas}
            onChange={() => form.setFieldValue('asignadoAId', undefined)}
            options={mapearOpcionesAreas(areasDisponibles)}
          />
        </Form.Item>
      ) : null}

      {accionActiva === 'derivar' ? (
        <Form.Item
          label="Encargado de la solicitud"
          name="asignadoAId"
          rules={[{ required: true, message: 'Seleccione un encargado' }]}
        >
          <Select
            disabled={!areaDestinoSeleccionada}
            loading={loadingUsuarios}
            placeholder={
              areaDestinoSeleccionada
                ? 'Seleccione un trabajador'
                : 'Seleccione el area destino primero'
            }
            options={trabajadoresAreaDestino.map((usuario) => ({
              label: `${usuario.nombres} ${usuario.apellidos}`,
              value: usuario.id,
            }))}
          />
        </Form.Item>
      ) : null}

      {accionActiva === 'estado' ? (
        <Form.Item
          label="Estado"
          name="estado"
          rules={[{ required: true, message: 'Seleccione el estado' }]}
        >
          <Select<EstadoSolicitud> options={OPCIONES_ESTADO_EDITABLE_SOLICITUD} />
        </Form.Item>
      ) : null}

      <Form.Item label="Comentario">
        <Typography.Paragraph type="secondary">
          El comentario quedara registrado en el historial.
        </Typography.Paragraph>
        <Form.Item
          name="comentario"
          noStyle
          rules={[
            {
              required: accionActiva === 'observacion',
              message: 'Ingrese una observacion',
            },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form.Item>
    </Form>
  );
}
