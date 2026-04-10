import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LayoutPrincipal } from '@/disenos/LayoutPrincipal';
import { RutaPrivada } from '@/rutas/RutaPrivada';

const PaginaAreas = lazy(() =>
  import('@/paginas/areas/PaginaAreas').then((module) => ({
    default: module.PaginaAreas,
  })),
);
const PaginaDashboard = lazy(() =>
  import('@/paginas/dashboard/PaginaDashboard').then((module) => ({
    default: module.PaginaDashboard,
  })),
);
const PaginaDetalleSolicitud = lazy(() =>
  import('@/paginas/detalle-solicitud/PaginaDetalleSolicitud').then((module) => ({
    default: module.PaginaDetalleSolicitud,
  })),
);
const PaginaDetalleUsuario = lazy(() =>
  import('@/paginas/detalle-usuario/PaginaDetalleUsuario').then((module) => ({
    default: module.PaginaDetalleUsuario,
  })),
);
const PaginaLogin = lazy(() =>
  import('@/paginas/login/PaginaLogin').then((module) => ({
    default: module.PaginaLogin,
  })),
);
const PaginaReportes = lazy(() =>
  import('@/paginas/reportes/PaginaReportes').then((module) => ({
    default: module.PaginaReportes,
  })),
);
const PaginaSolicitudes = lazy(() =>
  import('@/paginas/solicitudes/PaginaSolicitudes').then((module) => ({
    default: module.PaginaSolicitudes,
  })),
);
const PaginaTiposSolicitud = lazy(() =>
  import('@/paginas/tipos-solicitud/PaginaTiposSolicitud').then((module) => ({
    default: module.PaginaTiposSolicitud,
  })),
);
const PaginaUsuarios = lazy(() =>
  import('@/paginas/usuarios/PaginaUsuarios').then((module) => ({
    default: module.PaginaUsuarios,
  })),
);

function renderLazy(Component: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[240px] items-center justify-center text-municipal-700">
          Cargando pagina...
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: renderLazy(PaginaLogin),
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
        element: renderLazy(PaginaDashboard),
      },
      {
        path: 'solicitudes',
        element: renderLazy(PaginaSolicitudes),
      },
      {
        path: 'solicitudes/:id',
        element: renderLazy(PaginaDetalleSolicitud),
      },
      {
        path: 'areas',
        element: renderLazy(PaginaAreas),
      },
      {
        path: 'usuarios',
        element: renderLazy(PaginaUsuarios),
      },
      {
        path: 'usuarios/:id',
        element: renderLazy(PaginaDetalleUsuario),
      },
      {
        path: 'tipos-solicitud',
        element: renderLazy(PaginaTiposSolicitud),
      },
      {
        path: 'reportes',
        element: renderLazy(PaginaReportes),
      },
    ],
  },
]);
