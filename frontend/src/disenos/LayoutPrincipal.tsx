import { Breadcrumb, Button, Layout, Menu, Space, Typography } from 'antd';
import type { ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icono } from '@/componentes/ui/Icono';
import { TagRol } from '@/componentes/ui/tags/TagRol';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import type { RolUsuario } from '@/tipos/comun';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const itemsMenu: Array<{
  key: string;
  icon: ReactElement;
  label: string;
  roles?: RolUsuario[];
}> = [
  {
    key: '/dashboard',
    icon: <Icono nombre="dashboard" />,
    label: 'Dashboard',
  },
  {
    key: '/solicitudes',
    icon: <Icono nombre="solicitudes" />,
    label: 'Solicitudes',
  },
  {
    key: '/usuarios',
    icon: <Icono nombre="usuarios" />,
    label: 'Usuarios',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
  {
    key: '/tipos-solicitud',
    icon: <Icono nombre="tipos" />,
    label: 'Tipos de Solicitud',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
  {
    key: '/reportes',
    icon: <Icono nombre="reportes" />,
    label: 'Reportes',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
];

const titulosPorRuta: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/solicitudes': 'Solicitudes',
  '/usuarios': 'Usuarios',
  '/tipos-solicitud': 'Tipos de Solicitud',
  '/reportes': 'Reportes',
};

export function LayoutPrincipal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sesion, cerrarSesion } = useAutenticacion();

  const itemsMenuVisibles = itemsMenu.filter(
    (item) => !item.roles || item.roles.includes(sesion?.usuario.rol ?? 'TRABAJADOR'),
  );

  const selectedKey = itemsMenuVisibles.find((item) =>
    location.pathname.startsWith(item.key),
  )?.key;

  const titulo = titulosPorRuta[selectedKey ?? location.pathname] ?? 'Detalle';

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={272}
        className="!bg-marca-900"
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-6 rounded-3xl bg-white/10 p-4 text-white">
            <Text className="!text-xs !uppercase !tracking-[0.24em] !text-white/70">
              Operacion Tecnica
            </Text>
            <Title level={4} className="!mb-2 !mt-2 !text-white">
              DOM
            </Title>
            <Text className="!text-white/75">
              Seguimiento operativo de solicitudes, vencimientos y responsables.
            </Text>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={itemsMenuVisibles}
            className="!flex-1 !border-none !bg-transparent"
            onClick={({ key }) => navigate(key)}
          />

          <div className="mt-4 rounded-3xl bg-marca-700 p-4 text-white shadow-panel">
            <Space direction="vertical" size={6}>
              <TagRol rol={sesion?.usuario.rol} />
              <Text className="!text-white">
                {sesion?.usuario.nombres} {sesion?.usuario.apellidos}
              </Text>
              <Text className="!text-white/80">
                {sesion?.usuario.correo ?? 'Sesion no disponible'}
              </Text>
            </Space>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="flex h-auto items-center justify-between border-b border-municipal-100 bg-white/80 px-6 py-4 backdrop-blur">
          <div>
            <Breadcrumb items={[{ title: 'DOM' }, { title: titulo }]} />
            <Title level={3} className="!mb-0 !mt-2 !text-black">
              {titulo}
            </Title>
          </div>

          <Space size="middle">
            <TagRol rol={sesion?.usuario.rol} fallback="DOM" />
            <Button icon={<Icono nombre="usuario" />}>
              {sesion?.usuario.nombres ?? 'Mi Perfil'}
            </Button>
            <Button
              icon={<Icono nombre="salir" />}
              onClick={() => {
                cerrarSesion();
                navigate('/login');
              }}
            >
              Salir
            </Button>
          </Space>
        </Header>

        <Content className="p-6">
          <div className="min-h-[calc(100vh-130px)] rounded-[28px] bg-white/80 p-6 shadow-panel backdrop-blur">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
