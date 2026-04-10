import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormularioSolicitud } from '@/componentes/solicitudes/FormularioSolicitud';
import { Icono } from '@/componentes/ui/Icono';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { TagPrioridad } from '@/componentes/ui/tags/TagPrioridad';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { areasService } from '@/servicios/areas/areas.service';
import { solicitudesService } from '@/servicios/solicitudes/solicitudes.service';
import { tiposSolicitudService } from '@/servicios/tipos-solicitud/tiposSolicitud.service';
import { usuariosService } from '@/servicios/usuarios/usuarios.service';
import type { EstadoSolicitud, PrioridadSolicitud } from '@/tipos/comun';
import type { Solicitud, SolicitudPayload } from '@/tipos/solicitudes';
import {
  normalizarTextoOpcional,
  normalizarTextoRequerido,
} from '@/utilidades/crud';
import {
  OPCIONES_ESTADO_SOLICITUD,
  OPCIONES_FILTRO_PRIORIDAD_SOLICITUD,
  mapearOpcionesAreas,
  mapearOpcionesTiposSolicitud,
} from '@/utilidades/opciones';
import { puedeCrearSolicitudes } from '@/utilidades/permisos';

export function PaginaSolicitudes() {
  const navigate = useNavigate();
  const { sesion } = useAutenticacion();
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSolicitud>();
  const [areaFiltro, setAreaFiltro] = useState<number>();
  const [tipoFiltro, setTipoFiltro] = useState<number>();
  const [prioridadFiltro, setPrioridadFiltro] = useState<PrioridadSolicitud>();
  const [busqueda, setBusqueda] = useState('');
  const consulta = useConsulta(
    () =>
      solicitudesService.listar({
        busqueda: busqueda.trim() || undefined,
        estado: estadoFiltro,
        areaId: areaFiltro,
        tipoSolicitudId: tipoFiltro,
        prioridad: prioridadFiltro,
      }),
    [busqueda, estadoFiltro, areaFiltro, tipoFiltro, prioridadFiltro],
  );
  const areas = useConsulta(() => areasService.listar(), []);
  const tiposSolicitud = useConsulta(() => tiposSolicitudService.listar(), []);
  const usuarios = useConsulta(() => usuariosService.listar(), []);
  const [form] = Form.useForm<SolicitudPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const { loading: guardando, ejecutar } = useMutacion();
  const solicitudes = consulta.data ?? [];
  const areasActivas = (areas.data ?? []).filter((area) => area.activo);
  const tiposActivos = (tiposSolicitud.data ?? []).filter((tipo) => tipo.activo);
  const areaSeleccionada = Form.useWatch('areaActualId', form);
  const puedeCrear = puedeCrearSolicitudes(sesion?.usuario.rol);
  const trabajadoresDisponibles = (usuarios.data ?? []).filter(
    (usuario) =>
      usuario.rol === 'TRABAJADOR' &&
      (!areaSeleccionada || usuario.area.id === areaSeleccionada),
  );
  const filtrosArea = mapearOpcionesAreas(areasActivas);
  const filtrosTipoSolicitud = mapearOpcionesTiposSolicitud(tiposActivos);

  function cerrarModal() {
    setModalAbierto(false);
  }

  function abrirCrear() {
    form.resetFields();
    form.setFieldsValue({ prioridad: 'MEDIA' });
    setModalAbierto(true);
  }

  async function guardar(values: SolicitudPayload) {
    const comentario = values.comentario?.trim();
    const payload: SolicitudPayload = {
      ...values,
      titulo: normalizarTextoRequerido(values.titulo),
      descripcion: normalizarTextoRequerido(values.descripcion),
      fechaVencimiento: new Date(values.fechaVencimiento).toISOString(),
      asignadoAId: values.asignadoAId ?? undefined,
      comentario: normalizarTextoOpcional(comentario),
    };

    await ejecutar(() => solicitudesService.crear(payload), {
      mensajeExito: 'Solicitud creada',
      mensajeError: 'No fue posible crear',
      onSuccess: async (solicitud) => {
        cerrarModal();
        await consulta.refetch();
        navigate(`/solicitudes/${solicitud.id}`);
      },
    });
  }

  return (
    <PaginaModulo
      titulo="Solicitudes"
      descripcion="Listado de solicitudes ingresadas al sistema."
    >
      <Card
        className="rounded-3xl"
        extra={
          <Space>
            <Button onClick={() => void consulta.refetch()}>Actualizar</Button>
            {puedeCrear ? (
              <Button type="primary" icon={<Icono nombre="mas" />} onClick={abrirCrear}>
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
          empty={solicitudes.length === 0}
          emptyDescription="No hay solicitudes para mostrar."
        >
          <Space wrap className="mb-4">
            <Input.Search
              allowClear
              className="min-w-64"
              placeholder="Buscar por ID, titulo, estado, area o tipo"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <Select<EstadoSolicitud>
              allowClear
              className="min-w-40"
              placeholder="Filtrar estado"
              value={estadoFiltro}
              options={OPCIONES_ESTADO_SOLICITUD}
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
              options={OPCIONES_FILTRO_PRIORIDAD_SOLICITUD}
              onChange={setPrioridadFiltro}
            />
            <Button
              onClick={() => {
                setBusqueda('');
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
            dataSource={solicitudes}
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
                    <TagEstadoSolicitud
                      estado={record.estadoActual}
                      estaVencida={record.estaVencida}
                    />
                    {record.estaVencida && estado !== 'VENCIDA' ? (
                      <Tag color="#111827">Vencida</Tag>
                    ) : null}
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
                render: (prioridad: PrioridadSolicitud) => (
                  <TagPrioridad prioridad={prioridad} />
                ),
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
        onCancel={cerrarModal}
        onOk={() => form.submit()}
      >
        <FormularioSolicitud
          form={form}
          areas={areasActivas}
          tiposSolicitud={tiposActivos}
          trabajadoresDisponibles={trabajadoresDisponibles}
          loadingAreas={areas.loading}
          loadingTipos={tiposSolicitud.loading}
          loadingUsuarios={usuarios.loading}
          areaSeleccionada={areaSeleccionada}
          onFinish={(values) => void guardar(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
