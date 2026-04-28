import { Card, Col, Row, Table } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import { RechartsBarChart } from '../components/charts/RechartsBarChart';
import { RechartsDonutChart } from '../components/charts/RechartsDonutChart';
import { ModulePage } from '../components/ModulePage';
import { reportsService } from '../services/api';
import type { ReportCount } from '../types/domain';
import { priorityLabels, statusLabels } from '../types/domain';
import { mapPriorityReport, mapStatusReport, mapTypeReport, mapWorkloadReport } from '../utils/chartData';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

export function ReportsPage() {
  const [byStatus, setByStatus] = useState<ReportCount[]>([]);
  const [byPriority, setByPriority] = useState<ReportCount[]>([]);
  const [byType, setByType] = useState<ReportCount[]>([]);
  const [workload, setWorkload] = useState<ReportCount[]>([]);

  useEffect(() => {
    void Promise.all([
      reportsService.getTicketsByStatus(),
      reportsService.getTicketsByPriority(),
      reportsService.getTicketsByType(),
      reportsService.getWorkloadByWorker(),
    ]).then(([statusRows, priorityRows, typeRows, workloadRows]) => {
      setByStatus(statusRows);
      setByPriority(priorityRows);
      setByType(typeRows);
      setWorkload(workloadRows);
    });
  }, []);

  const countColumn: Columns<ReportCount> = [{ title: 'Cantidad', dataIndex: 'count' }];

  return (
    <ModulePage title="Reportes" description="Indicadores operativos para encargados y suplentes.">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Solicitudes por estado">
            <RechartsBarChart data={mapStatusReport(byStatus)} vertical />
            <Table rowKey={(row) => row.status ?? 'status'} pagination={false} dataSource={byStatus} columns={[{ title: 'Estado', render: (_, row) => (row.status ? statusLabels[row.status] : '-') }, ...countColumn]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Solicitudes por prioridad">
            <RechartsDonutChart data={mapPriorityReport(byPriority)} />
            <Table rowKey={(row) => row.priority ?? 'priority'} pagination={false} dataSource={byPriority} columns={[{ title: 'Prioridad', render: (_, row) => (row.priority ? priorityLabels[row.priority] : '-') }, ...countColumn]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Solicitudes por tipo">
            <RechartsBarChart data={mapTypeReport(byType)} />
            <Table rowKey={(row) => row.ticketTypeId ?? 'type'} pagination={false} dataSource={byType} columns={[{ title: 'Tipo', render: (_, row) => row.ticketType?.name ?? row.ticketTypeId ?? '-' }, ...countColumn]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Carga por trabajador">
            <RechartsBarChart data={mapWorkloadReport(workload)} />
            <Table rowKey={(row) => row.assignedToId ?? 'worker'} pagination={false} dataSource={workload} columns={[{ title: 'Trabajador', render: (_, row) => row.worker?.name ?? row.assignedToId ?? '-' }, ...countColumn]} />
          </Card>
        </Col>
      </Row>
    </ModulePage>
  );
}
