import { App } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { obtenerMensajeError } from '@/utilidades/crud';

type OpcionesMutacion<TResult> = {
  mensajeExito?: string;
  mensajeError?: string;
  onSuccess?: (resultado: TResult) => Promise<void> | void;
  onError?: (error: unknown, textoError: string) => Promise<void> | void;
};

export function useMutacion() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const montajeActivoRef = useRef(true);
  const mutacionesActivasRef = useRef(0);

  useEffect(() => {
    montajeActivoRef.current = true;

    return () => {
      montajeActivoRef.current = false;
    };
  }, []);

  async function ejecutar<TResult>(
    accion: () => Promise<TResult>,
    opciones: OpcionesMutacion<TResult> = {},
  ) {
    mutacionesActivasRef.current += 1;

    if (montajeActivoRef.current) {
      setLoading(true);
    }

    try {
      const resultado = await accion();

      if (opciones.mensajeExito) {
        message.success(opciones.mensajeExito);
      }

      await opciones.onSuccess?.(resultado);
      return resultado;
    } catch (error) {
      const textoError = obtenerMensajeError(
        error,
        opciones.mensajeError ?? 'No fue posible completar la accion',
      );

      await opciones.onError?.(error, textoError);

      if (!opciones.onError) {
        message.error(textoError);
      }

      return null;
    } finally {
      mutacionesActivasRef.current = Math.max(mutacionesActivasRef.current - 1, 0);

      if (montajeActivoRef.current) {
        setLoading(mutacionesActivasRef.current > 0);
      }
    }
  }

  return {
    loading,
    ejecutar,
  };
}
