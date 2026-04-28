import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';

type SummaryCard = {
  title: string;
  value: string | number;
};

export function ModulePage({
  title,
  description,
  summaryCards = [],
  actions,
  children,
}: {
  title: string;
  description: string;
  summaryCards?: SummaryCard[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Space direction="vertical" size={24} className="full-width">
      <div className="module-header">
        <div>
          <Typography.Title level={2} className="module-title">
            {title}
          </Typography.Title>
          <Typography.Paragraph className="module-description">{description}</Typography.Paragraph>
        </div>
        {actions ? <Space wrap>{actions}</Space> : null}
      </div>

      {summaryCards.length > 0 ? (
        <Row gutter={[12, 12]}>
          {summaryCards.map((card) => (
            <Col xs={24} sm={12} lg={8} xl={4} key={card.title}>
              <Card className="summary-card" bordered={false}>
                <Statistic
                  title={<span className="summary-title">{card.title}</span>}
                  value={card.value}
                  valueStyle={{ fontSize: 22, fontWeight: 700, color: '#111827' }}
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
