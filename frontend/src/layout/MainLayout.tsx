import { Button, Layout, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Icon } from '../components/Icon';
import { RoleTag } from '../components/StatusTags';
import { isManagementRole } from '../types/domain';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const user = session?.user;
  const canManage = isManagementRole(user?.role);

  const items: MenuProps['items'] = [
    { key: '/dashboard', icon: <Icon name="dashboard" />, label: 'Dashboard' },
    { key: '/tickets', icon: <Icon name="tickets" />, label: 'Solicitudes' },
    { key: '/ticket-types', icon: <Icon name="ticketTypes" />, label: 'Tipos de solicitud' },
    ...(canManage
      ? [
          { key: '/users', icon: <Icon name="users" />, label: 'Usuarios' },
          { key: '/reports', icon: <Icon name="reports" />, label: 'Reportes' },
        ]
      : []),
  ];

  const selectedKey = items.find((item) => typeof item?.key === 'string' && location.pathname.startsWith(item.key))?.key as string | undefined;

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" collapsedWidth="0" width={272} className="sidebar">
        <div className="brand-panel">
          <Typography.Text className="brand-eyebrow">Sistema Interno</Typography.Text>
          <Typography.Title level={3} className="brand-title">
            Trazabilidad DOM
          </Typography.Title>
          <Typography.Text className="brand-copy">Gestion de solicitudes municipales</Typography.Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={items}
          className="sidebar-menu"
          onClick={({ key }) => navigate(key)}
        />

        <div className="user-panel">
          <Typography.Text strong>{user?.name}</Typography.Text>
          <Typography.Text type="secondary">{user?.email}</Typography.Text>
        </div>
      </Sider>

      <Layout>
        <Header className="topbar">
          <div>
            <Typography.Text type="secondary">Sistema / DOM</Typography.Text>
            <Typography.Title level={4} className="topbar-title">
              Panel de gestion
            </Typography.Title>
          </div>
          <Space>
            <RoleTag role={user?.role} />
            <Button
            onClick={() => {
                logout();
                navigate('/login');
              }}
              icon={<Icon name="logout" />}
            >
              Salir
            </Button>
          </Space>
        </Header>
        <Content className="content-shell">
          <div className="content-panel">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
