import { useCallback, useEffect, useRef, useState } from 'react';

type ResultadoValorDebounceado<T> = {
  valorDebounceado: T;
  sincronizarInmediatamente: (siguienteValor?: T) => void;
};

export function useValorDebounceado<T>(
  valor: T,
  retrasoMs: number,
): ResultadoValorDebounceado<T> {
  const [valorDebounceado, setValorDebounceado] = useState(valor);
  const ultimoValorRef = useRef(valor);

  useEffect(() => {
    ultimoValorRef.current = valor;

    const timeoutId = window.setTimeout(() => {
      setValorDebounceado(ultimoValorRef.current);
    }, retrasoMs);

    return () => window.clearTimeout(timeoutId);
  }, [retrasoMs, valor]);

  const sincronizarInmediatamente = useCallback((...args: [T?]) => {
    const valorFinal =
      args.length > 0 ? (args[0] as T) : ultimoValorRef.current;

    ultimoValorRef.current = valorFinal;
    setValorDebounceado(valorFinal);
  }, []);

  return {
    valorDebounceado,
    sincronizarInmediatamente,
  };
}
