import { Alert, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';

type EstadoConsultaProps<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
  empty: boolean;
  emptyDescription?: string;
  children: ReactNode;
};

export function EstadoConsulta<T>({
  loading,
  error,
  data,
  empty,
  emptyDescription = 'No hay datos disponibles.',
  children,
}: EstadoConsultaProps<T>) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  if (!data || empty) {
    return <Empty description={emptyDescription} />;
  }

  return <>{children}</>;
}
