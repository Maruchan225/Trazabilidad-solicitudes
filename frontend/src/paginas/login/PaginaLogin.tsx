import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Icono } from '@/componentes/ui/Icono';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import type { CredencialesLogin } from '@/tipos/autenticacion';
import {
  obtenerRutaInicialPorRol,
  obtenerRutaSeguraPorRol,
} from '@/utilidades/permisos';

export function PaginaLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { autenticado, iniciarSesion, sesion } = useAutenticacion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rutaSolicitada = (location.state as { from?: { pathname?: string } } | null)
    ?.from?.pathname;
  const redirectTo = obtenerRutaSeguraPorRol(
    rutaSolicitada,
    sesion?.usuario.rol,
  );

  if (autenticado) {
    return <Navigate to={redirectTo} replace />;
  }

  async function manejarEnvio(values: CredencialesLogin) {
    setLoading(true);
    setError(null);

    try {
      const nuevaSesion = await iniciarSesion(values);
      navigate(obtenerRutaInicialPorRol(nuevaSesion.usuario.rol), {
        replace: true,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'No fue posible iniciar sesion',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-municipal px-4 py-10">
      <Card className="w-full max-w-md rounded-[32px] shadow-panel" bordered={false}>
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Typography.Text className="!uppercase !tracking-[0.2em] !text-black">
              Acceso Interno
            </Typography.Text>
            <Typography.Title level={2} className="!mb-2 !mt-3 !text-black">
              Trazabilidad Municipal
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-black">
              Inicie sesion con sus credenciales.
            </Typography.Paragraph>
          </div>

          {error ? <Alert type="error" showIcon message={error} /> : null}

          <Form layout="vertical" size="large" onFinish={manejarEnvio}>
            <Form.Item
              label="Correo institucional"
              name="email"
              rules={[{ required: true, message: 'Ingrese su correo' }]}
            >
              <Input prefix={<Icono nombre="usuario" />} placeholder="encargado@demo.cl" />
            </Form.Item>
            <Form.Item
              label="Contrasena"
              name="contrasena"
              rules={[{ required: true, message: 'Ingrese su contrasena' }]}
            >
              <Input.Password prefix={<Icono nombre="candado" />} placeholder="********" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Ingresar
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
