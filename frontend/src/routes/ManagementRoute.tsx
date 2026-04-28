import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { isManagementRole } from '../types/domain';

export function ManagementRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (!isManagementRole(session?.user.role)) {
    return <Navigate to="/tickets" replace />;
  }

  return children;
}
