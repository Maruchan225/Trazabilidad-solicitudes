import { useCallback, useEffect, useState } from 'react';

type EstadoConsulta<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useConsulta<T>(
  consulta: () => Promise<T>,
  dependencias: unknown[] = [],
): EstadoConsulta<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ejecutar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await consulta();
      setData(resultado);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar la informacion',
      );
    } finally {
      setLoading(false);
    }
  }, dependencias);

  useEffect(() => {
    void ejecutar();
  }, [ejecutar]);

  return {
    data,
    loading,
    error,
    refetch: ejecutar,
  };
}
