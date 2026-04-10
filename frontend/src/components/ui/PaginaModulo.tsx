import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';

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
  return (
    <Space direction="vertical" size={24} className="w-full">
      <div>
        <Typography.Title level={2} className="!mb-2 !text-municipal-900">
          {titulo}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 !max-w-3xl !text-base !text-municipal-700">
          {descripcion}
        </Typography.Paragraph>
      </div>

      {tarjetas.length > 0 ? (
        <Row gutter={[16, 16]}>
          {tarjetas.map((tarjeta) => (
            <Col xs={24} md={12} xl={6} key={tarjeta.titulo}>
              <Card bordered={false} className="h-full rounded-3xl">
                <Statistic title={tarjeta.titulo} value={tarjeta.valor} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : null}

      {children}
    </Space>
  );
}
