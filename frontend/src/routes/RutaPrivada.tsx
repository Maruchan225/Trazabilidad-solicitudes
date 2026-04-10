import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '@/hooks/useAutenticacion';

export function RutaPrivada({ children }: { children: ReactElement }) {
  const location = useLocation();
  const { autenticado } = useAutenticacion();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
