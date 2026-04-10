import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { EstadoConsulta } from '@/components/ui/EstadoConsulta';
import { PaginaModulo } from '@/components/ui/PaginaModulo';
import { useAutenticacion } from '@/hooks/useAutenticacion';
import { useConsulta } from '@/hooks/useConsulta';
import { areasService } from '@/services/areas/areas.service';
import { solicitudesService } from '@/services/solicitudes/solicitudes.service';
import { tiposSolicitudService } from '@/services/tipos-solicitud/tiposSolicitud.service';
import { usuariosService } from '@/services/usuarios/usuarios.service';
import type { EstadoSolicitud, PrioridadSolicitud } from '@/types/comun';
import type { Solicitud, SolicitudPayload } from '@/types/solicitudes';
import { useState } from 'react';

export function PaginaSolicitudes() {
  const navigate = useNavigate();
  const { sesion } = useAutenticacion();
  const consulta = useConsulta(() => solicitudesService.listar(), []);
  const areas = useConsulta(() => areasService.listar(), []);
  const tiposSolicitud = useConsulta(() => tiposSolicitudService.listar(), []);
  const usuarios = useConsulta(() => usuariosService.listar(), []);
  const [form] = Form.useForm<SolicitudPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSolicitud>();
  const [areaFiltro, setAreaFiltro] = useState<number>();
  const [tipoFiltro, setTipoFiltro] = useState<number>();
  const [prioridadFiltro, setPrioridadFiltro] = useState<PrioridadSolicitud>();
  const areaSeleccionada = Form.useWatch('areaActualId', form);
  const puedeCrear = sesion?.usuario.rol === 'ENCARGADO' || sesion?.usuario.rol === 'REEMPLAZO';
  const trabajadoresDisponibles = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      (!areaSeleccionada || usuario.area.id === areaSeleccionada),
  );
  const filtrosEstado = Array.from(
    new Set((consulta.data ?? []).map((solicitud) => solicitud.estadoActual)),
  ).map((estado) => ({ label: estado, value: estado }));
  const filtrosPrioridad = Array.from(
    new Set((consulta.data ?? []).map((solicitud) => solicitud.prioridad)),
  ).map((prioridad) => ({ label: prioridad, value: prioridad }));
  const filtrosArea = (areas.data ?? [])
    .filter((area) => area.activo)
    .map((area) => ({ label: area.nombre, value: area.id }));
  const filtrosTipoSolicitud = (tiposSolicitud.data ?? [])
    .filter((tipo) => tipo.activo)
    .map((tipo) => ({ label: tipo.nombre, value: tipo.id }));
  const solicitudesFiltradas = (consulta.data ?? []).filter(
    (solicitud) =>
      (!estadoFiltro || solicitud.estadoActual === estadoFiltro) &&
      (!areaFiltro || solicitud.areaActual.id === areaFiltro) &&
      (!tipoFiltro || solicitud.tipoSolicitud.id === tipoFiltro) &&
      (!prioridadFiltro || solicitud.prioridad === prioridadFiltro),
  );

  function abrirCrear() {
    form.resetFields();
    form.setFieldsValue({ prioridad: 'MEDIA' });
    setModalAbierto(true);
  }

  async function guardar(values: SolicitudPayload) {
    setGuardando(true);

    const comentario = values.comentario?.trim();
    const payload: SolicitudPayload = {
      ...values,
      titulo: values.titulo.trim(),
      descripcion: values.descripcion.trim(),
      fechaVencimiento: new Date(values.fechaVencimiento).toISOString(),
      asignadoAId: values.asignadoAId ?? undefined,
      comentario: comentario ? comentario : undefined,
    };

    try {
      const solicitud = await solicitudesService.crear(payload);
      message.success('Solicitud creada');
      setModalAbierto(false);
      await consulta.refetch();
      navigate(`/solicitudes/${solicitud.id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No fue posible crear');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PaginaModulo
      titulo="Solicitudes"
      descripcion="Listado real de solicitudes consumido desde el backend municipal."
    >
      <Card
        className="rounded-3xl"
        extra={
          <Space>
            <Button onClick={() => void consulta.refetch()}>Actualizar</Button>
            {puedeCrear ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
                Nueva Solicitud
              </Button>
            ) : null}
          </Space>
        }
      >
        <EstadoConsulta
          loading={consulta.loading}
          error={consulta.error}
          data={consulta.data}
          empty={(consulta.data?.length ?? 0) === 0}
          emptyDescription="No hay solicitudes para mostrar."
        >
          <Space wrap className="mb-4">
            <Select<EstadoSolicitud>
              allowClear
              className="min-w-40"
              placeholder="Filtrar estado"
              value={estadoFiltro}
              options={filtrosEstado}
              onChange={setEstadoFiltro}
            />
            <Select<number>
              allowClear
              className="min-w-44"
              placeholder="Filtrar area"
              value={areaFiltro}
              options={filtrosArea}
              onChange={setAreaFiltro}
            />
            <Select<number>
              allowClear
              className="min-w-48"
              placeholder="Filtrar tipo"
              value={tipoFiltro}
              options={filtrosTipoSolicitud}
              onChange={setTipoFiltro}
            />
            <Select<PrioridadSolicitud>
              allowClear
              className="min-w-40"
              placeholder="Filtrar prioridad"
              value={prioridadFiltro}
              options={filtrosPrioridad}
              onChange={setPrioridadFiltro}
            />
            <Button
              onClick={() => {
                setEstadoFiltro(undefined);
                setAreaFiltro(undefined);
                setTipoFiltro(undefined);
                setPrioridadFiltro(undefined);
              }}
            >
              Limpiar filtros
            </Button>
          </Space>

          <Table<Solicitud>
            rowKey="id"
            dataSource={solicitudesFiltradas}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                sorter: (a, b) => a.id - b.id,
              },
              {
                title: 'Titulo',
                dataIndex: 'titulo',
                sorter: (a, b) => a.titulo.localeCompare(b.titulo),
                render: (_, record) => (
                  <Link to={`/solicitudes/${record.id}`}>{record.titulo}</Link>
                ),
              },
              {
                title: 'Estado',
                dataIndex: 'estadoActual',
                sorter: (a, b) => a.estadoActual.localeCompare(b.estadoActual),
                render: (estado: string, record) => (
                  <Space>
                    <Tag color={record.estaVencida ? 'red' : 'blue'}>{estado}</Tag>
                    {record.estaVencida ? <Tag color="orange">Vencida</Tag> : null}
                  </Space>
                ),
              },
              {
                title: 'Area',
                sorter: (a, b) =>
                  a.areaActual.nombre.localeCompare(b.areaActual.nombre),
                render: (_, record) => record.areaActual.nombre,
              },
              {
                title: 'Tipo',
                sorter: (a, b) =>
                  a.tipoSolicitud.nombre.localeCompare(b.tipoSolicitud.nombre),
                render: (_, record) => record.tipoSolicitud.nombre,
              },
              {
                title: 'Prioridad',
                dataIndex: 'prioridad',
                sorter: (a, b) => a.prioridad.localeCompare(b.prioridad),
              },
            ]}
          />
        </EstadoConsulta>
      </Card>

      <Modal
        title="Nueva solicitud"
        open={modalAbierto}
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={() => setModalAbierto(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(values) => void guardar(values)}>
          <Form.Item
            label="Titulo"
            name="titulo"
            rules={[
              { required: true, message: 'Ingrese el titulo' },
              { min: 5, message: 'El titulo debe tener al menos 5 caracteres' },
              { max: 200, message: 'El titulo no puede superar 200 caracteres' },
            ]}
          >
            <Input maxLength={200} showCount />
          </Form.Item>
          <Form.Item
            label="Descripcion"
            name="descripcion"
            rules={[
              { required: true, message: 'Ingrese la descripcion' },
              {
                min: 10,
                message: 'La descripcion debe tener al menos 10 caracteres',
              },
              {
                max: 5000,
                message: 'La descripcion no puede superar 5000 caracteres',
              },
            ]}
          >
            <Input.TextArea rows={4} maxLength={5000} showCount />
          </Form.Item>
          <Form.Item
            label="Prioridad"
            name="prioridad"
            rules={[{ required: true, message: 'Seleccione la prioridad' }]}
          >
            <Select<PrioridadSolicitud>
              options={[
                { label: 'Baja', value: 'BAJA' },
                { label: 'Media', value: 'MEDIA' },
                { label: 'Alta', value: 'ALTA' },
                { label: 'Urgente', value: 'URGENTE' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Fecha de vencimiento"
            name="fechaVencimiento"
            rules={[{ required: true, message: 'Ingrese la fecha de vencimiento' }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            label="Area"
            name="areaActualId"
            rules={[{ required: true, message: 'Seleccione el area' }]}
          >
            <Select
              loading={areas.loading}
              onChange={() => form.setFieldValue('asignadoAId', undefined)}
              options={(areas.data ?? [])
                .filter((area) => area.activo)
                .map((area) => ({ label: area.nombre, value: area.id }))}
            />
          </Form.Item>
          <Form.Item
            label="Tipo de solicitud"
            name="tipoSolicitudId"
            rules={[{ required: true, message: 'Seleccione el tipo' }]}
          >
            <Select
              loading={tiposSolicitud.loading}
              options={(tiposSolicitud.data ?? [])
                .filter((tipo) => tipo.activo)
                .map((tipo) => ({ label: tipo.nombre, value: tipo.id }))}
            />
          </Form.Item>
          <Form.Item label="Asignar a" name="asignadoAId">
            <Select
              allowClear
              disabled={!areaSeleccionada}
              loading={usuarios.loading}
              placeholder={
                areaSeleccionada
                  ? 'Seleccione un trabajador'
                  : 'Seleccione un area primero'
              }
              options={trabajadoresDisponibles.map((usuario) => ({
                label: `${usuario.nombres} ${usuario.apellidos}`,
                value: usuario.id,
              }))}
            />
          </Form.Item>
          <Form.Item label="Comentario inicial" name="comentario">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </PaginaModulo>
  );
}
