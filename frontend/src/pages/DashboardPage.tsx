import { Card, Col, Row } from 'antd';
import { useEffect, useState } from 'react';
import { RechartsBarChart } from '../components/charts/RechartsBarChart';
import { RechartsDonutChart } from '../components/charts/RechartsDonutChart';
import { ModulePage } from '../components/ModulePage';
import { dashboardService } from '../services/api';
import type { DashboardData } from '../types/domain';
import { getDashboardAlertData, getDashboardStatusData } from '../utils/chartData';

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    void dashboardService.getDashboard().then(setDashboard);
  }, []);

  const summaryCards = [
    { title: 'Total', value: dashboard?.totalTickets ?? dashboard?.assignedTickets ?? 0 },
    { title: 'Ingresadas', value: dashboard?.enteredTickets ?? 0 },
    { title: 'Derivadas', value: dashboard?.derivedTickets ?? 0 },
    { title: 'En proceso', value: dashboard?.inProgressTickets ?? 0 },
    { title: 'Finalizadas', value: dashboard?.finishedTickets ?? 0 },
    { title: 'Vencidas', value: dashboard?.overdueTickets ?? 0 },
  ];

  return (
    <ModulePage title="Dashboard" description="Panel operativo con metricas reales, carga de trabajo y alertas clave para seguimiento diario." summaryCards={summaryCards}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Estado de solicitudes" className="chart-card">
            <RechartsBarChart data={getDashboardStatusData(dashboard)} vertical />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Alertas operativas" className="chart-card">
            <RechartsDonutChart data={getDashboardAlertData(dashboard)} />
          </Card>
        </Col>
      </Row>
    </ModulePage>
  );
}
