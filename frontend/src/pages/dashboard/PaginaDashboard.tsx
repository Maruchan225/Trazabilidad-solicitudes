import { Card, Col, List, Row, Tag, Typography } from 'antd';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useConsulta } from '@/hooks/useConsulta';
import { reportesService } from '@/services/reportes/reportes.service';

export function PaginaDashboard() {
  const resumen = useConsulta(() => reportesService.obtenerResumenGeneral(), []);

  return (
    <EstadoConsulta
      loading={resumen.loading}
      error={resumen.error}
      data={resumen.data}
      empty={!resumen.data}
      emptyDescription="No fue posible obtener metricas del dashboard."
    >
      <PaginaModulo
        titulo="Dashboard"
        descripcion="Vista inicial conectada al backend para mostrar metricas base del sistema municipal."
        tarjetas={[
          {
            titulo: 'Total solicitudes',
            valor: resumen.data?.totalSolicitudes ?? 0,
          },
          {
            titulo: 'En proceso',
            valor: resumen.data?.solicitudesEnProceso ?? 0,
          },
          {
            titulo: 'Cerradas',
            valor: resumen.data?.solicitudesCerradas ?? 0,
          },
          {
            titulo: 'Vencidas',
            valor: resumen.data?.solicitudesVencidas ?? 0,
          },
        ]}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card title="Resumen operativo" className="rounded-3xl">
              <List
                dataSource={[
                  `Solicitudes ingresadas: ${resumen.data?.solicitudesIngresadas ?? 0}`,
                  `Solicitudes finalizadas: ${resumen.data?.solicitudesFinalizadas ?? 0}`,
                  `Proximas a vencer: ${resumen.data?.solicitudesProximasAVencer ?? 0}`,
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card title="Alertas del dia" className="rounded-3xl">
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-arena p-4">
                  <Typography.Text strong>Solicitudes proximas a vencer</Typography.Text>
                  <div className="mt-2">
                    <Tag color="orange">
                      {resumen.data?.solicitudesProximasAVencer ?? 0} en seguimiento
                    </Tag>
                  </div>
                </div>
                <div className="rounded-2xl bg-municipal-50 p-4">
                  <Typography.Text strong>Solicitudes cerradas</Typography.Text>
                  <div className="mt-2">
                    <Tag color="green">
                      {resumen.data?.solicitudesCerradas ?? 0} resueltas
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </PaginaModulo>
    </EstadoConsulta>
  );
}
