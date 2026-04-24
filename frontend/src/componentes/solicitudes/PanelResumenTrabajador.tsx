import { Alert, Card, Col, Row, Statistic, Space, Typography } from 'antd';
import { Icono } from '@/componentes/ui/Icono';
import type { ResumenGeneral } from '@/tipos/reportes';

const { Text } = Typography;

interface Props {
  resumen: ResumenGeneral | null;
  loading: boolean;
}

export function PanelResumenTrabajador({ resumen, loading }: Props) {
  if (!resumen && !loading) return null;

  const nuevas = (resumen?.solicitudesIngresadas ?? 0) + (resumen?.solicitudesDerivadas ?? 0);
  const enProceso = resumen?.solicitudesEnProceso ?? 0;
  const cerradas = (resumen?.solicitudesFinalizadas ?? 0) + (resumen?.solicitudesCerradas ?? 0);
  const vencidas = resumen?.solicitudesVencidas ?? 0;
  const proximas = resumen?.solicitudesProximasAVencer ?? 0;

  return (
    <div className="mb-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="rounded-3xl shadow-sm bg-orange-50/40 border-2 border-orange-200/60">
            <Statistic
              title={<Text strong className="text-orange-800">Nuevas Asignadas</Text>}
              value={nuevas}
              loading={loading}
              prefix={<Icono nombre="solicitudes" className="text-marca-600 mr-2" />}
              valueStyle={{ color: '#b5540d', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="rounded-3xl shadow-sm bg-marca-50/50 border-2 border-marca-200/60">
            <Statistic
              title={<Text strong className="text-marca-800">En Proceso</Text>}
              value={enProceso}
              loading={loading}
              prefix={<Icono nombre="dashboard" className="text-marca-600 mr-2" />}
              valueStyle={{ color: '#b5540d', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="rounded-3xl shadow-sm bg-orange-100/30 border-2 border-orange-300/40">
            <Statistic
              title={<Text strong className="text-orange-900">Cerradas</Text>}
              value={cerradas}
              loading={loading}
              prefix={<Icono nombre="check" className="text-orange-700 mr-2" />}
              valueStyle={{ color: '#9a3412', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {(vencidas > 0 || proximas > 0) && (
        <Space direction="vertical" className="w-full mt-4" size={8}>
          {vencidas > 0 && (
            <Alert
              message={
                <Text strong>
                  ¡Atención! Tienes {vencidas} {vencidas === 1 ? 'solicitud vencida' : 'solicitudes vencidas'}.
                </Text>
              }
              description="Por favor, revisa estas solicitudes y actualiza su estado lo antes posible."
              type="error"
              showIcon
              className="rounded-2xl border-none shadow-sm"
            />
          )}
          {proximas > 0 && (
            <Alert
              message={
                <Text strong>
                  Tienes {proximas} {proximas === 1 ? 'solicitud próxima' : 'solicitudes próximas'} a vencer.
                </Text>
              }
              description="Estas solicitudes vencerán en los próximos 3 días."
              type="warning"
              showIcon
              className="rounded-2xl border-none shadow-sm"
            />
          )}
        </Space>
      )}
    </div>
  );
}
