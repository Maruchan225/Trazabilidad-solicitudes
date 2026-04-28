import { Navigate, createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { ReportsPage } from '../pages/ReportsPage';
import { TicketDetailPage } from '../pages/TicketDetailPage';
import { TicketTypesPage } from '../pages/TicketTypesPage';
import { TicketsPage } from '../pages/TicketsPage';
import { UsersPage } from '../pages/UsersPage';
import { ManagementRoute } from './ManagementRoute';
import { PrivateRoute } from './PrivateRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'tickets/:id', element: <TicketDetailPage /> },
      { path: 'ticket-types', element: <TicketTypesPage /> },
      { path: 'users', element: <ManagementRoute><UsersPage /></ManagementRoute> },
      { path: 'reports', element: <ManagementRoute><ReportsPage /></ManagementRoute> },
    ],
  },
]);
