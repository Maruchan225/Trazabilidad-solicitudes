import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { Area } from '@/tipos/areas';
import type { PrioridadSolicitud } from '@/tipos/comun';
import type { SolicitudPayload } from '@/tipos/solicitudes';
import type { TipoSolicitud } from '@/tipos/tiposSolicitud';
import type { Usuario } from '@/tipos/usuarios';
import {
  OPCIONES_PRIORIDAD_SOLICITUD,
  mapearOpcionesAreas,
  mapearOpcionesTrabajadores,
  mapearOpcionesTiposSolicitud,
} from '@/utilidades/opciones';

type FormularioSolicitudProps = {
  form: FormInstance<SolicitudPayload>;
  areas: Area[];
  tiposSolicitud: TipoSolicitud[];
  trabajadoresDisponibles: Usuario[];
  loadingAreas?: boolean;
  loadingTipos?: boolean;
  loadingUsuarios?: boolean;
  areaSeleccionada?: number;
  onFinish: (values: SolicitudPayload) => void;
};

export function FormularioSolicitud({
  form,
  areas,
  tiposSolicitud,
  trabajadoresDisponibles,
  loadingAreas = false,
  loadingTipos = false,
  loadingUsuarios = false,
  areaSeleccionada,
  onFinish,
}: FormularioSolicitudProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
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
      <Form.Item
        label="Fecha de vencimiento"
        name="fechaVencimiento"
        rules={[{ required: true, message: 'Ingrese la fecha de vencimiento' }]}
      >
        <Input type="datetime-local" />
      </Form.Item>
      <Form.Item
        label="Area"
        name="areaActualId"
        rules={[{ required: true, message: 'Seleccione el area' }]}
      >
        <Select
          loading={loadingAreas}
          onChange={() => form.setFieldValue('asignadoAId', undefined)}
          options={mapearOpcionesAreas(areas)}
        />
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
      <Form.Item label="Asignar a" name="asignadoAId">
        <Select
          allowClear
          disabled={!areaSeleccionada}
          loading={loadingUsuarios}
          placeholder={
            areaSeleccionada
              ? 'Seleccione un trabajador'
              : 'Seleccione un area primero'
          }
          options={mapearOpcionesTrabajadores(trabajadoresDisponibles)}
        />
      </Form.Item>
      <Form.Item label="Comentario inicial" name="comentario">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}
