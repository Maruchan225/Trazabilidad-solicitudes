import { message } from 'antd';
import { useState } from 'react';
import { obtenerMensajeError } from '@/utilidades/crud';

type OpcionesMutacion<TResult> = {
  mensajeExito?: string;
  mensajeError?: string;
  onSuccess?: (resultado: TResult) => Promise<void> | void;
  onError?: (error: unknown, textoError: string) => Promise<void> | void;
};

export function useMutacion() {
  const [loading, setLoading] = useState(false);

  async function ejecutar<TResult>(
    accion: () => Promise<TResult>,
    opciones: OpcionesMutacion<TResult> = {},
  ) {
    setLoading(true);

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
      setLoading(false);
    }
  }

  return {
    loading,
    ejecutar,
  };
}
