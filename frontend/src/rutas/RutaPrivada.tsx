import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import {
  obtenerRutaInicialPorRol,
  rutaPermitidaParaRol,
} from '@/utilidades/permisos';

export function RutaPrivada({ children }: { children: ReactElement }) {
  const location = useLocation();
  const { autenticado, sesion } = useAutenticacion();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!rutaPermitidaParaRol(location.pathname, sesion?.usuario.rol)) {
    return (
      <Navigate
        to={obtenerRutaInicialPorRol(sesion?.usuario.rol)}
        replace
      />
    );
  }

  return children;
}
