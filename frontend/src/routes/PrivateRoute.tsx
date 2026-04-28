import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function PrivateRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { authenticated } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
