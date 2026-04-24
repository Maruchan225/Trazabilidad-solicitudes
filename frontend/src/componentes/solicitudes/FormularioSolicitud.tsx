import { Form, Input, Select, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { CanalIngreso, PrioridadSolicitud } from '@/tipos/comun';
import type { SolicitudPayload } from '@/tipos/solicitudes';
import type { TipoSolicitud } from '@/tipos/tiposSolicitud';
import type { Usuario } from '@/tipos/usuarios';
import {
  OPCIONES_CANAL_INGRESO,
  OPCIONES_PRIORIDAD_SOLICITUD,
  mapearOpcionesTrabajadores,
  mapearOpcionesTiposSolicitud,
} from '@/utilidades/opciones';

type FormularioSolicitudProps = {
  form: FormInstance<SolicitudPayload>;
  tiposSolicitud: TipoSolicitud[];
  trabajadoresDisponibles: Usuario[];
  loadingTipos?: boolean;
  loadingUsuarios?: boolean;
  onFinish: (values: SolicitudPayload) => void;
};

export function FormularioSolicitud({
  form,
  tiposSolicitud,
  trabajadoresDisponibles,
  loadingTipos = false,
  loadingUsuarios = false,
  onFinish,
}: FormularioSolicitudProps) {
  const tipoSolicitudSeleccionadoId = Form.useWatch('tipoSolicitudId', form);
  const tipoSolicitudSeleccionado = tiposSolicitud.find(
    (tipo) => tipo.id === tipoSolicitudSeleccionadoId,
  );
  const diasSla = tipoSolicitudSeleccionado?.diasSla ?? null;
  const fechaVencimientoCalculada =
    typeof diasSla === 'number'
      ? new Date(Date.now() + diasSla * 24 * 60 * 60 * 1000).toLocaleString(
          'es-CL',
        )
      : null;

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Canal de ingreso" name="canalIngreso" rules={[{ required: true, message: 'Seleccione el canal de ingreso' }]}>
        <Select<CanalIngreso> options={OPCIONES_CANAL_INGRESO} />
      </Form.Item>
      <Form.Item
        label="Tipo de solicitud"
        name="tipoSolicitudId"
        rules={[{ required: true, message: 'Seleccione el tipo' }]}
      >
        <Select
          loading={loadingTipos}
          options={mapearOpcionesTiposSolicitud(tiposSolicitud)}
        />
      </Form.Item>
      <Form.Item label="Correlativo">
        <Typography.Text className="!text-black/75">
          Se asignara automaticamente como identificador operativo principal al registrar la solicitud en DOM.
        </Typography.Text>
      </Form.Item>
      <Form.Item
        label="Titulo"
        name="titulo"
        rules={[
          { required: true, message: 'Ingrese el titulo' },
          { min: 5, message: 'El titulo debe tener al menos 5 caracteres' },
          { max: 200, message: 'El titulo no puede superar 200 caracteres' },
        ]}
      >
        <Input maxLength={200} showCount />
      </Form.Item>
      <Form.Item
        label="Descripcion"
        name="descripcion"
        rules={[
          { required: true, message: 'Ingrese la descripcion' },
          {
            min: 10,
            message: 'La descripcion debe tener al menos 10 caracteres',
          },
          {
            max: 5000,
            message: 'La descripcion no puede superar 5000 caracteres',
          },
        ]}
      >
        <Input.TextArea rows={4} maxLength={5000} showCount />
      </Form.Item>
      <Form.Item
        label="Prioridad"
        name="prioridad"
        rules={[{ required: true, message: 'Seleccione la prioridad' }]}
      >
        <Select<PrioridadSolicitud> options={OPCIONES_PRIORIDAD_SOLICITUD} />
      </Form.Item>
      <Form.Item label="Fecha de vencimiento calculada">
        <Typography.Text className="!text-black/75">
          {!tipoSolicitudSeleccionado
            ? 'Seleccione un tipo de solicitud para calcular el vencimiento.'
            : fechaVencimientoCalculada
              ? `Se calculara automaticamente a ${diasSla} dia(s) desde el registro: ${fechaVencimientoCalculada}.`
              : 'El tipo de solicitud seleccionado no tiene dias SLA configurados.'}
        </Typography.Text>
      </Form.Item>
      <Form.Item
        label="Responsable inicial"
        name="asignadoAId"
        rules={[{ required: true, message: 'Seleccione un usuario responsable' }]}
      >
        <Select
          loading={loadingUsuarios}
          placeholder="Seleccione un usuario responsable"
          options={mapearOpcionesTrabajadores(trabajadoresDisponibles)}
        />
      </Form.Item>
      <Form.Item label="Observacion inicial" name="comentario">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}
