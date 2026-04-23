import { Button, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { Icono } from '@/componentes/ui/Icono';

type TarjetaResumen = {
  titulo: string;
  valor: string | number;
};

type PaginaModuloProps = {
  titulo: string;
  descripcion: string;
  tarjetas?: TarjetaResumen[];
  children?: ReactNode;
};

export function PaginaModulo({
  titulo,
  descripcion,
  tarjetas = [],
  children,
}: PaginaModuloProps) {
  const navigate = useNavigate();
  const { sesion } = useAutenticacion();

  function volver() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(sesion?.usuario.rol === 'TRABAJADOR' ? '/solicitudes' : '/dashboard');
  }

  return (
    <Space direction="vertical" size={24} className="w-full">
      <div>
        <Button icon={<Icono nombre="flecha-izquierda" />} onClick={volver} className="!mb-4">
          Volver
        </Button>
        <Typography.Title level={2} className="!mb-2 !text-black">
          {titulo}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 !max-w-3xl !text-base !text-black">
          {descripcion}
        </Typography.Paragraph>
      </div>

      {tarjetas.length > 0 ? (
        <Row gutter={[12, 12]}>
          {tarjetas.map((tarjeta) => (
            <Col xs={24} sm={12} lg={8} xl={4} key={tarjeta.titulo}>
              <Card 
                bordered={false} 
                className="h-full rounded-2xl shadow-sm border border-gray-100/50" 
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Statistic 
                  title={<span className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">{tarjeta.titulo}</span>} 
                  value={tarjeta.valor} 
                  valueStyle={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginTop: '4px' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      {children}
    </Space>
  );
}
