import { useCallback, useEffect, useRef, useState } from 'react';

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
  const consultaRef = useRef(consulta);
  const montajeActivoRef = useRef(true);
  const solicitudActualRef = useRef(0);

  useEffect(() => {
    consultaRef.current = consulta;
  }, [consulta]);

  useEffect(() => {
    montajeActivoRef.current = true;

    return () => {
      montajeActivoRef.current = false;
    };
  }, []);

  const ejecutar = useCallback(async () => {
    const solicitudId = ++solicitudActualRef.current;

    setLoading(true);
    setError(null);

    try {
      const resultado = await consultaRef.current();
      if (
        !montajeActivoRef.current ||
        solicitudId !== solicitudActualRef.current
      ) {
        return;
      }

      setData(resultado);
    } catch (error) {
      if (
        !montajeActivoRef.current ||
        solicitudId !== solicitudActualRef.current
      ) {
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar la informacion',
      );
    } finally {
      if (
        montajeActivoRef.current &&
        solicitudId === solicitudActualRef.current
      ) {
        setLoading(false);
      }
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
