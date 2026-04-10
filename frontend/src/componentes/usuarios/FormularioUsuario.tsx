import { Form, Input, Select, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { RolUsuario } from '@/tipos/comun';
import type { Area } from '@/tipos/areas';
import type { UsuarioPayload } from '@/tipos/usuarios';
import { OPCIONES_ROL_USUARIO, mapearOpcionesAreas } from '@/utilidades/opciones';

type FormularioUsuarioProps = {
  form: FormInstance<UsuarioPayload>;
  areas: Area[];
  loadingAreas?: boolean;
  modo: 'crear' | 'editar';
  onFinish: (values: UsuarioPayload) => void;
};

export function FormularioUsuario({
  form,
  areas,
  loadingAreas = false,
  modo,
  onFinish,
}: FormularioUsuarioProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Nombres"
        name="nombres"
        rules={[
          { required: true, message: 'Ingrese los nombres' },
          { whitespace: true, message: 'Ingrese los nombres' },
          { min: 2, message: 'Los nombres deben tener al menos 2 caracteres' },
          { max: 120, message: 'Los nombres no pueden superar 120 caracteres' },
        ]}
      >
        <Input maxLength={120} showCount />
      </Form.Item>
      <Form.Item
        label="Apellidos"
        name="apellidos"
        rules={[
          { required: true, message: 'Ingrese los apellidos' },
          { whitespace: true, message: 'Ingrese los apellidos' },
          { min: 2, message: 'Los apellidos deben tener al menos 2 caracteres' },
          { max: 120, message: 'Los apellidos no pueden superar 120 caracteres' },
        ]}
      >
        <Input maxLength={120} showCount />
      </Form.Item>
      <Form.Item
        label="Correo"
        name="email"
        rules={[
          { required: true, message: 'Ingrese el correo' },
          { type: 'email', message: 'Ingrese un correo valido' },
        ]}
      >
        <Input maxLength={254} />
      </Form.Item>
      <Form.Item
        label={modo === 'editar' ? 'Nueva contrasena' : 'Contrasena'}
        name="contrasena"
        rules={[
          {
            required: modo === 'crear',
            message: 'Ingrese la contrasena',
          },
          { whitespace: true, message: 'Ingrese la contrasena' },
          { min: 8, message: 'Debe tener al menos 8 caracteres' },
          { max: 128, message: 'No puede superar 128 caracteres' },
        ]}
      >
        <Input.Password maxLength={128} />
      </Form.Item>
      <Form.Item
        label="Telefono"
        name="telefono"
        rules={[{ max: 30, message: 'El telefono no puede superar 30 caracteres' }]}
      >
        <Input maxLength={30} />
      </Form.Item>
      <Form.Item
        label="Rol"
        name="rol"
        rules={[{ required: true, message: 'Seleccione un rol' }]}
      >
        <Select<RolUsuario> options={OPCIONES_ROL_USUARIO} />
      </Form.Item>
      <Form.Item
        label="Area"
        name="areaId"
        rules={[{ required: true, message: 'Seleccione un area' }]}
      >
        <Select loading={loadingAreas} options={mapearOpcionesAreas(areas)} />
      </Form.Item>
      <Form.Item label="Activo" name="activo" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  );
}
