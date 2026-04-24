import { Form, Input, Select, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { EstadoSolicitud } from '@/tipos/comun';
import type { Usuario } from '@/tipos/usuarios';
import {
  OPCIONES_ESTADO_EDITABLE_SOLICITUD,
  OPCIONES_ESTADO_GESTION_SOLICITUD,
  mapearOpcionesTrabajadores,
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
  estado?: EstadoSolicitud;
  comentario?: string;
};

type FormularioAccionSolicitudProps = {
  accionActiva: AccionSolicitud | null;
  form: FormInstance<FormularioAccionSolicitudValores>;
  trabajadoresArea: Usuario[];
  trabajadoresDerivables: Usuario[];
  loadingUsuarios?: boolean;
  esGestion?: boolean;
  onFinish: (values: FormularioAccionSolicitudValores) => void;
};

export const TITULOS_ACCION_SOLICITUD: Record<AccionSolicitud, string> = {
  asignar: 'Asignar responsable',
  derivar: 'Derivar solicitud',
  estado: 'Cambiar estado',
  observacion: 'Agregar observacion',
  finalizar: 'Finalizar solicitud',
  cerrar: 'Cerrar solicitud',
};

export function FormularioAccionSolicitud({
  accionActiva,
  form,
  trabajadoresArea,
  trabajadoresDerivables,
  loadingUsuarios = false,
  esGestion = false,
  onFinish,
}: FormularioAccionSolicitudProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {accionActiva === 'asignar' ? (
        <Form.Item
          label="Responsable"
          name="asignadoAId"
          rules={[{ required: true, message: 'Seleccione un usuario responsable' }]}
        >
          <Select
            loading={loadingUsuarios}
            options={mapearOpcionesTrabajadores(trabajadoresArea)}
          />
        </Form.Item>
      ) : null}

      {accionActiva === 'derivar' ? (
        <>
          <Typography.Paragraph type="secondary">
            La derivacion se realiza directamente entre usuarios responsables.
          </Typography.Paragraph>
          <Form.Item
            label="Derivar a"
            name="asignadoAId"
            rules={[{ required: true, message: 'Seleccione un usuario destino' }]}
          >
            <Select
              loading={loadingUsuarios}
              placeholder="Seleccione un usuario"
              options={mapearOpcionesTrabajadores(trabajadoresDerivables)}
            />
          </Form.Item>
        </>
      ) : null}

      {accionActiva === 'estado' ? (
        <Form.Item
          label="Estado"
          name="estado"
          rules={[{ required: true, message: 'Seleccione el estado' }]}
        >
          <Select<EstadoSolicitud>
            options={
              esGestion
                ? OPCIONES_ESTADO_GESTION_SOLICITUD
                : OPCIONES_ESTADO_EDITABLE_SOLICITUD
            }
          />
        </Form.Item>
      ) : null}

      <Form.Item label="Comentario">
        <Typography.Paragraph type="secondary">
          El comentario quedara registrado en la trazabilidad de la solicitud.
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
