import { Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'No fue posible iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <Card className="login-card">
        <Typography.Text className="login-eyebrow">Sistema Interno</Typography.Text>
        <Typography.Title level={1} className="login-title">
          Trazabilidad DOM
        </Typography.Title>
        <Typography.Paragraph type="secondary">Ingrese con sus credenciales institucionales.</Typography.Paragraph>
        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ email: 'encargado@demo.cl', password: '11223344' }}>
          <Form.Item name="email" label="Correo" rules={[{ required: true, type: 'email', message: 'Ingrese un correo valido' }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="Contrasena" rules={[{ required: true, message: 'Ingrese la contrasena' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
          <Button type="primary" htmlType="submit" block loading={loading} className="mt-16">
            Ingresar
          </Button>
        </Form>
      </Card>
    </main>
  );
}
