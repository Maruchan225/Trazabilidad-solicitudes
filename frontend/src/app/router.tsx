import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LayoutPrincipal } from '@/layouts/LayoutPrincipal';
import { PaginaAreas } from '@/pages/areas/PaginaAreas';
import { PaginaDashboard } from '@/pages/dashboard/PaginaDashboard';
import { PaginaDetalleSolicitud } from '@/pages/detalle-solicitud/PaginaDetalleSolicitud';
import { PaginaLogin } from '@/pages/login/PaginaLogin';
import { PaginaReportes } from '@/pages/reportes/PaginaReportes';
import { PaginaSolicitudes } from '@/pages/solicitudes/PaginaSolicitudes';
import { PaginaTiposSolicitud } from '@/pages/tipos-solicitud/PaginaTiposSolicitud';
import { PaginaUsuarios } from '@/pages/usuarios/PaginaUsuarios';
import { RutaPrivada } from '@/routes/RutaPrivada';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PaginaLogin />,
  },
  {
    path: '/',
    element: (
      <RutaPrivada>
        <LayoutPrincipal />
      </RutaPrivada>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <PaginaDashboard />,
      },
      {
        path: 'solicitudes',
        element: <PaginaSolicitudes />,
      },
      {
        path: 'solicitudes/:id',
        element: <PaginaDetalleSolicitud />,
      },
      {
        path: 'areas',
        element: <PaginaAreas />,
      },
      {
        path: 'usuarios',
        element: <PaginaUsuarios />,
      },
      {
        path: 'tipos-solicitud',
        element: <PaginaTiposSolicitud />,
      },
      {
        path: 'reportes',
        element: <PaginaReportes />,
      },
    ],
  },
]);
