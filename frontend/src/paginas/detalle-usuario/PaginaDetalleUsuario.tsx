import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Modal,
  Row,
  Table,
} from 'antd';
import { useState } from 'react';
import { FormularioUsuario } from '@/componentes/usuarios/FormularioUsuario';
import { Link, useParams } from 'react-router-dom';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';
import { PaginaModulo } from '@/componentes/ui/PaginaModulo';
import { TagActivo } from '@/componentes/ui/tags/TagActivo';
import { TagEstadoSolicitud } from '@/componentes/ui/tags/TagEstadoSolicitud';
import { TagPrioridad } from '@/componentes/ui/tags/TagPrioridad';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { useConsulta } from '@/ganchos/useConsulta';
import { useMutacion } from '@/ganchos/useMutacion';
import { solicitudesService } from '@/servicios/solicitudes/solicitudes.service';
import { usuariosService } from '@/servicios/usuarios/usuarios.service';
import type { Solicitud } from '@/tipos/solicitudes';
import type { UsuarioPayload } from '@/tipos/usuarios';
import { mensajeContiene } from '@/utilidades/crud';
import { puedeGestionarCatalogos } from '@/utilidades/permisos';
import {
  construirPayloadUsuario,
  obtenerValoresFormularioUsuario,
} from '@/utilidades/usuarios';

export function PaginaDetalleUsuario() {
  const { message } = App.useApp();
  const { sesion } = useAutenticacion();
  const { id } = useParams();
  const usuarioId = Number(id);
  const [form] = Form.useForm<UsuarioPayload>();
  const [modalAbierto, setModalAbierto] = useState(false);
  const { loading: guardando, ejecutar } = useMutacion();

  const usuario = useConsulta(
    () => usuariosService.obtenerPorId(usuarioId),
    [usuarioId],
  );
  const solicitudes = useConsulta(() => solicitudesService.listar(), []);

  const solicitudesACargo = (solicitudes.data ?? []).filter(
    (solicitud) => solicitud.asignadoA?.id === usuarioId,
  );
  const puedeGestionar = puedeGestionarCatalogos(sesion?.usuario.rol);

  function cerrarModal() {
    setModalAbierto(false);
  }

  function abrirEditar() {
    if (!usuario.data) {
      return;
    }

    form.setFieldsValue(obtenerValoresFormularioUsuario(usuario.data));
    setModalAbierto(true);
  }

  async function guardar(values: UsuarioPayload) {
    const payload = construirPayloadUsuario(values);

    await ejecutar(() => usuariosService.actualizar(usuarioId, payload), {
      mensajeExito: 'Usuario actualizado con exito',
      mensajeError: 'No fue posible guardar',
      onSuccess: async () => {
        cerrarModal();
        await Promise.all([usuario.refetch(), solicitudes.refetch()]);
      },
      onError: async (error, textoError) => {
        if (mensajeContiene(error, 'rut')) {
          form.setFields([{ name: 'rut', errors: [textoError] }]);
        }

        if (mensajeContiene(error, 'correo')) {
          form.setFields([{ name: 'email', errors: [textoError] }]);
        }

        message.error(textoError);
      },
    });
  }

  return (
    <PaginaModulo
      titulo={`Detalle de Usuario #${id ?? ''}`}
      descripcion="Vista con los datos del usuario y las solicitudes que tiene actualmente a cargo."
    >
      <EstadoConsulta
        loading={usuario.loading || solicitudes.loading}
        error={usuario.error ?? solicitudes.error}
        data={usuario.data}
        empty={!usuario.data}
        emptyDescription="No fue posible cargar el usuario."
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={9}>
            <Card
              className="rounded-3xl"
              title="Datos del usuario"
              extra={
                <Button
                  type="primary"
                  onClick={abrirEditar}
                  disabled={!usuario.data || !puedeGestionar}
                >
                  Editar
                </Button>
              }
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Nombre completo">
                  {usuario.data
                    ? `${usuario.data.nombres} ${usuario.data.apellidos}`
                    : ''}
                </Descriptions.Item>
                <Descriptions.Item label="Correo">
                  {usuario.data?.email}
                </Descriptions.Item>
                <Descriptions.Item label="RUT">
                  {usuario.data?.rut}
                </Descriptions.Item>
                <Descriptions.Item label="Telefono">
                  {usuario.data?.telefono || 'Sin telefono'}
                </Descriptions.Item>
                <Descriptions.Item label="Rol">
                  {usuario.data?.rol}
                </Descriptions.Item>
                <Descriptions.Item label="Estado">
                  <TagActivo activo={Boolean(usuario.data?.activo)} />
                </Descriptions.Item>
                <Descriptions.Item label="Solicitudes a cargo">
                  {solicitudesACargo.length}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} xl={15}>
            <Card
              className="rounded-3xl"
              title="Solicitudes asignadas"
            >
              <Table<Solicitud>
                rowKey="id"
                dataSource={solicitudesACargo}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: 'Este usuario no tiene solicitudes asignadas.' }}
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
                    render: (_estado: string, record) => (
                      <TagEstadoSolicitud
                        estado={record.estadoActual}
                        estaVencida={record.estaVencida}
                      />
                    ),
                  },
                  {
                    title: 'Prioridad',
                    dataIndex: 'prioridad',
                    render: (prioridad) => <TagPrioridad prioridad={prioridad} />,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </EstadoConsulta>

      <Modal
        title="Editar usuario"
        open={modalAbierto}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
      >
        <FormularioUsuario
          form={form}
          modo="editar"
          onFinish={(values) => void guardar(values)}
        />
      </Modal>
    </PaginaModulo>
  );
}
