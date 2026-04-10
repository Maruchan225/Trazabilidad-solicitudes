import { useContext } from 'react';
import { AutenticacionContext } from '@/providers/AutenticacionProvider';

export function useAutenticacion() {
  const contexto = useContext(AutenticacionContext);

  if (!contexto) {
    throw new Error(
      'useAutenticacion debe utilizarse dentro de AutenticacionProvider',
    );
  }

  return contexto;
}
