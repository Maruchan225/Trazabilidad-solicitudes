import {
  BarChartOutlined,
  CheckOutlined,
  DashboardOutlined,
  EyeOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  ProfileOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

type IconName = 'dashboard' | 'tickets' | 'ticketTypes' | 'users' | 'reports' | 'user' | 'logout' | 'add' | 'view' | 'check' | 'warning';

const icons: Record<IconName, ReactNode> = {
  dashboard: <DashboardOutlined />,
  tickets: <FileTextOutlined />,
  ticketTypes: <ProfileOutlined />,
  users: <TeamOutlined />,
  reports: <BarChartOutlined />,
  user: <UserOutlined />,
  logout: <LogoutOutlined />,
  add: <PlusOutlined />,
  view: <EyeOutlined />,
  check: <CheckOutlined />,
  warning: <WarningOutlined />,
};

export function Icon({ name }: { name: IconName }) {
  return <>{icons[name]}</>;
}
