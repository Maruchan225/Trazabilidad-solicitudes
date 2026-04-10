import {
  AreaChartOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import { useEffect, type ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '@/hooks/useAutenticacion';
import type { RolUsuario } from '@/types/comun';

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
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
  {
    key: '/solicitudes',
    icon: <FileTextOutlined />,
    label: 'Solicitudes',
  },
  {
    key: '/areas',
    icon: <ApartmentOutlined />,
    label: 'Areas',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
  {
    key: '/usuarios',
    icon: <TeamOutlined />,
    label: 'Usuarios',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
  {
    key: '/tipos-solicitud',
    icon: <FileSearchOutlined />,
    label: 'Tipos de Solicitud',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
  {
    key: '/reportes',
    icon: <AreaChartOutlined />,
    label: 'Reportes',
    roles: ['ENCARGADO', 'REEMPLAZO'],
  },
];

const titulosPorRuta: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/solicitudes': 'Solicitudes',
  '/areas': 'Areas',
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

  useEffect(() => {
    if (sesion?.usuario.rol === 'TRABAJADOR' && location.pathname === '/dashboard') {
      navigate('/solicitudes', { replace: true });
    }
  }, [location.pathname, navigate, sesion?.usuario.rol]);

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
        className="!bg-municipal-900"
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-6 rounded-3xl bg-white/10 p-4 text-white">
            <Text className="!text-xs !uppercase !tracking-[0.24em] !text-white/70">
              Sistema Interno
            </Text>
            <Title level={4} className="!mb-2 !mt-2 !text-white">
              Trazabilidad Municipal
            </Title>
            <Text className="!text-white/75">
              Base conectada al backend para operacion municipal.
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

          <div className="mt-4 rounded-3xl bg-terracota/90 p-4 text-white shadow-panel">
            <Space direction="vertical" size={6}>
              <Tag color="gold">{sesion?.usuario.rol ?? 'Sin sesion'}</Tag>
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
            <Breadcrumb items={[{ title: 'Sistema' }, { title: titulo }]} />
            <Title level={3} className="!mb-0 !mt-2 !text-municipal-900">
              {titulo}
            </Title>
          </div>

          <Space size="middle">
            <Tag color="green">{sesion?.usuario.rol ?? 'Municipal'}</Tag>
            <Button icon={<UserOutlined />}>
              {sesion?.usuario.nombres ?? 'Mi Perfil'}
            </Button>
            <Button
              icon={<LogoutOutlined />}
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
