import { Card, Col, Row, Select, Table } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { RechartsBarChart } from '../components/charts/RechartsBarChart';
import { RechartsDonutChart } from '../components/charts/RechartsDonutChart';
import { ModulePage } from '../components/ModulePage';
import { reportsService } from '../services/api';
import type { ReportCount, TypeStatusReport } from '../types/domain';
import { priorityLabels, statusLabels } from '../types/domain';
import { mapPriorityReport, mapStatusReport, mapTypeReport, mapWorkloadReport, typeStatusStackKeys } from '../utils/chartData';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

export function ReportsPage() {
  const [byStatus, setByStatus] = useState<ReportCount[]>([]);
  const [byPriority, setByPriority] = useState<ReportCount[]>([]);
  const [byType, setByType] = useState<ReportCount[]>([]);
  const [byTypeAndStatus, setByTypeAndStatus] = useState<TypeStatusReport[]>([]);
  const [selectedTypeStatusId, setSelectedTypeStatusId] = useState<string>();
  const [workload, setWorkload] = useState<ReportCount[]>([]);

  useEffect(() => {
    void Promise.all([
      reportsService.getTicketsByStatus(),
      reportsService.getTicketsByPriority(),
      reportsService.getTicketsByType(),
      reportsService.getTicketsByTypeAndStatus(),
      reportsService.getWorkloadByWorker(),
    ]).then(([statusRows, priorityRows, typeRows, typeStatusRows, workloadRows]) => {
      setByStatus(statusRows);
      setByPriority(priorityRows);
      setByType(typeRows);
      setByTypeAndStatus(typeStatusRows);
      setSelectedTypeStatusId((current) => current ?? typeStatusRows[0]?.ticketTypeId);
      setWorkload(workloadRows);
    });
  }, []);

  const countColumn: Columns<ReportCount> = [{ title: 'Cantidad', dataIndex: 'count' }];
  const workloadChartData = useMemo(
    () => mapWorkloadReport([...workload].sort((left, right) => right.count - left.count)).slice(0, 12),
    [workload],
  );
  const selectedTypeStatusRows = useMemo(
    () => byTypeAndStatus.filter((row) => row.ticketTypeId === selectedTypeStatusId),
    [byTypeAndStatus, selectedTypeStatusId],
  );
  const selectedTypeStatusChartData = useMemo(() => {
    const selectedType = selectedTypeStatusRows[0];
    if (!selectedType) return [];

    return typeStatusStackKeys.map((status) => ({
      label: status.label,
      value: selectedType.counts[status.key] ?? 0,
      color: status.color,
    }));
  }, [selectedTypeStatusRows]);

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
          <Card title="Solicitudes por tipo" className="report-comparison-card">
            <RechartsBarChart data={mapTypeReport(byType)} vertical />
            <Table
              rowKey={(row) => row.ticketTypeId ?? 'type'}
              pagination={false}
              dataSource={byType}
              size="small"
              scroll={{ y: 360 }}
              columns={[{ title: 'Tipo', render: (_, row) => row.ticketType?.name ?? row.ticketTypeId ?? '-' }, ...countColumn]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Carga por trabajador" className="report-comparison-card">
            <RechartsBarChart data={workloadChartData} vertical />
            <Table
              rowKey={(row) => row.assignedToId ?? 'worker'}
              pagination={false}
              dataSource={workload}
              size="small"
              scroll={{ y: 360 }}
              columns={[{ title: 'Trabajador', render: (_, row) => row.worker?.name ?? row.assignedToId ?? '-' }, ...countColumn]}
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Card
            title="Estados por tipo de solicitud"
            extra={
              <Select
                value={selectedTypeStatusId}
                onChange={setSelectedTypeStatusId}
                options={byTypeAndStatus.map((row) => ({ value: row.ticketTypeId, label: row.ticketType.name }))}
                placeholder="Seleccione tipo"
                style={{ minWidth: 260 }}
              />
            }
          >
            <RechartsBarChart data={selectedTypeStatusChartData} />
          </Card>
        </Col>
      </Row>
    </ModulePage>
  );
}
