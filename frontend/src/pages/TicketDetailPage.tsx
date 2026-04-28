import { Button, Card, Col, Descriptions, Form, Input, Modal, Row, Select, Space, Table, Tag, Upload, Typography } from 'antd';
import type { TableProps, UploadFile } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Icon } from '../components/Icon';
import { ModulePage } from '../components/ModulePage';
import { PriorityTag, StatusTag } from '../components/StatusTags';
import { attachmentsService, commentsService, ticketsService } from '../services/api';
import type { Ticket, TicketAttachment, TicketComment, TicketHistory, TicketStatus } from '../types/domain';
import { inputChannelLabels, isManagementRole, statusLabels } from '../types/domain';
import { dueStatusColors } from '../utils/colors';
import { formatDate, formatDateTime, formatFileSize } from '../utils/formatters';
import { getTicketDueStatus } from '../utils/tickets';

type Columns<T> = NonNullable<TableProps<T>['columns']>;

function describeHistory(item: TicketHistory) {
  const actor = item.user?.name ?? 'Sistema';
  const statusChange = item.previousStatus && item.newStatus ? ` de ${statusLabels[item.previousStatus]} a ${statusLabels[item.newStatus]}` : '';

  if (item.action === 'CREATED') return `${actor} creo la solicitud.`;
  if (item.action === 'UPDATED') return `${actor} actualizo la solicitud.`;
  if (item.action === 'ASSIGNED') return `${actor} reasigno la solicitud.`;
  if (item.action === 'DERIVED') return `${actor} derivo la solicitud.`;
  if (item.action === 'STATUS_CHANGED') return `${actor} cambio el estado${statusChange}.`;
  if (item.action === 'FINISHED') return `${actor} finalizo la solicitud.`;
  if (item.action === 'CLOSED') return `${actor} cerro la solicitud.`;
  if (item.action === 'REOPENED') return `${actor} reabrio la solicitud.`;
  if (item.action === 'COMMENT_ADDED') return `${actor} agrego una observacion.`;
  if (item.action === 'ATTACHMENT_ADDED') return `${actor} subio un adjunto.`;
  return `${actor} realizo la accion ${item.action}.`;
}

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/tickets';
  const canManage = isManagementRole(session?.user.role);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [commentForm] = Form.useForm();
  const [reopenForm] = Form.useForm();
  const isClosed = ticket?.status === 'CLOSED';
  const isFinished = ticket?.status === 'FINISHED';
  const dueStatus = ticket ? getTicketDueStatus(ticket) : null;
  const statusOptions = Object.entries(statusLabels)
    .filter(([value]) => !['FINISHED', 'CLOSED'].includes(value))
    .map(([value, label]) => ({ value, label }));

  async function loadTicketDetail() {
    if (!id) return;
    setLoading(true);
    try {
      const [ticketData, historyRows, commentRows, attachmentRows] = await Promise.all([
        ticketsService.getTicket(id),
        ticketsService.getHistory(id),
        commentsService.listComments(id),
        attachmentsService.listAttachments(id),
      ]);
      setTicket(ticketData);
      setHistory(historyRows);
      setComments(commentRows);
      setAttachments(attachmentRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTicketDetail();
  }, [id]);

  async function changeStatus(status: TicketStatus) {
    if (!id) return;
    await ticketsService.changeStatus(id, status);
    await loadTicketDetail();
  }

  async function finishTicket() {
    if (!id) return;
    await ticketsService.finishTicket(id);
    await loadTicketDetail();
  }

  async function closeTicket() {
    if (!id) return;
    await ticketsService.closeTicket(id);
    await loadTicketDetail();
  }

  function confirmCloseTicket() {
    Modal.confirm({
      title: 'Cerrar solicitud',
      content: 'Una vez cerrada no se pueden realizar cambios. Desea continuar?',
      okText: 'Cerrar solicitud',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => closeTicket(),
    });
  }

  async function reopenTicket(values: { observation: string }) {
    if (!id) return;
    await ticketsService.reopenTicket(id, values.observation);
    setReopenModalOpen(false);
    reopenForm.resetFields();
    await loadTicketDetail();
  }

  async function createComment(values: { content: string }) {
    if (!id) return;
    await commentsService.createComment(id, values.content);
    commentForm.resetFields();
    await loadTicketDetail();
  }

  async function uploadAttachment(fileList: UploadFile[]) {
    if (!id || !fileList[0]?.originFileObj) return;
    await attachmentsService.uploadAttachment(id, fileList[0].originFileObj);
    await loadTicketDetail();
  }

  const commentColumns: Columns<TicketComment> = [
    { title: 'Observacion', dataIndex: 'content' },
    { title: 'Usuario', render: (_, row) => row.user?.name ?? '-' },
    { title: 'Fecha', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
  ];

  const attachmentColumns: Columns<TicketAttachment> = [
    { title: 'Archivo', dataIndex: 'originalName' },
    { title: 'Tamano', render: (_, row) => formatFileSize(row.size) },
    { title: 'Fecha', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
  ];

  return (
    <ModulePage
      title={`Detalle de Solicitud ${ticket?.code ?? ticket?.correlative ?? ''}`}
      description="Informacion principal, observaciones, adjuntos e historial de trazabilidad."
      actions={<Button onClick={() => navigate(returnTo)}>Volver</Button>}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card
            title="Informacion principal"
            loading={loading && !ticket}
            extra={
              ticket ? (
                <Space wrap>
                  {!isClosed && !isFinished ? (
                    <>
                      <Select<TicketStatus>
                        className="status-select"
                        placeholder="Cambiar estado"
                        onChange={(status) => void changeStatus(status)}
                        options={statusOptions}
                      />
                      <Button icon={<Icon name="check" />} onClick={() => void finishTicket()}>Finalizar</Button>
                    </>
                  ) : null}
                  {canManage && isFinished ? <Button onClick={() => setReopenModalOpen(true)}>Reabrir</Button> : null}
                  {canManage && isFinished ? <Button danger onClick={confirmCloseTicket}>Cerrar</Button> : null}
                </Space>
              ) : null
            }
          >
            {ticket ? (
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Titulo">{ticket.title}</Descriptions.Item>
                <Descriptions.Item label="Estado"><StatusTag status={ticket.status} /></Descriptions.Item>
                <Descriptions.Item label="Prioridad"><PriorityTag priority={ticket.priority} /></Descriptions.Item>
                <Descriptions.Item label="Canal de ingreso">{inputChannelLabels[ticket.inputChannel]}</Descriptions.Item>
                <Descriptions.Item label="Tipo de solicitud">{ticket.ticketType?.name ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Responsable">{ticket.assignedTo?.name ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Fecha de creacion">{formatDateTime(ticket.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Fecha de vencimiento">{formatDate(ticket.dueDate)}</Descriptions.Item>
                <Descriptions.Item label="Estado de plazo">
                  {dueStatus === 'OVERDUE' ? <Tag color={dueStatusColors.overdue}>Vencio el {formatDate(ticket.dueDate)}</Tag> : null}
                  {dueStatus === 'NEAR_DUE' ? <Tag color={dueStatusColors.nearDue}>Solicitud proxima a vencer</Tag> : null}
                  {dueStatus === 'ON_TIME' ? <Tag color={dueStatusColors.onTime}>Dentro de plazo</Tag> : null}
                  {dueStatus === 'FINISHED' ? <Tag color={dueStatusColors.onTime}>Plazo cerrado</Tag> : null}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha de finalizacion">{formatDateTime(ticket.finishedAt)}</Descriptions.Item>
                <Descriptions.Item label="Fecha de cierre">{formatDateTime(ticket.closedAt)}</Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>

          <Card title="Observaciones" className="detail-card">
            <Space direction="vertical" className="full-width">
              <Form form={commentForm} layout="inline" onFinish={createComment}>
                <Form.Item name="content" rules={[{ required: true, min: 2, message: 'Ingrese una observacion' }]} className="grow-field">
                  <Input disabled={isClosed} placeholder="Agregar observacion" />
                </Form.Item>
                <Button type="primary" disabled={isClosed} htmlType="submit">Agregar</Button>
              </Form>
              <Table rowKey="id" dataSource={comments} columns={commentColumns} pagination={false} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Space direction="vertical" size={16} className="full-width">
            <Card title="Descripcion">
              <Typography.Paragraph className="description-box">{ticket?.description ?? '-'}</Typography.Paragraph>
            </Card>

            <Card
              title="Adjuntos"
              extra={
                <Upload disabled={isClosed} beforeUpload={() => false} maxCount={1} showUploadList={false} onChange={({ fileList }) => void uploadAttachment(fileList)}>
                  <Button disabled={isClosed}>Subir adjunto</Button>
                </Upload>
              }
            >
              <Table rowKey="id" dataSource={attachments} columns={attachmentColumns} pagination={false} size="small" />
            </Card>

            <Card title="Historial">
              <Space direction="vertical" className="history-list">
                {history.map((item) => (
                  <div className="history-entry" key={item.id}>
                    <div className="history-entry-header">
                      <Typography.Text strong>{item.action}</Typography.Text>
                      <Typography.Text type="secondary">{formatDateTime(item.createdAt)}</Typography.Text>
                    </div>
                    <Typography.Paragraph className="history-entry-copy">{describeHistory(item)}</Typography.Paragraph>
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
      <Modal title="Reabrir solicitud" open={reopenModalOpen} onCancel={() => setReopenModalOpen(false)} onOk={() => reopenForm.submit()} okText="Reabrir" cancelText="Cancelar">
        <Form form={reopenForm} layout="vertical" onFinish={reopenTicket}>
          <Form.Item name="observation" label="Motivo" rules={[{ required: true, min: 2, message: 'Ingrese el motivo de reapertura' }]}>
            <Input.TextArea rows={3} placeholder="Detalle por que se reabre la solicitud" />
          </Form.Item>
        </Form>
      </Modal>
    </ModulePage>
  );
}
