import { useContext } from 'react';
import { AutenticacionContext } from '@/proveedores/AutenticacionProvider';

export function useAutenticacion() {
  const contexto = useContext(AutenticacionContext);

  if (!contexto) {
    throw new Error(
      'useAutenticacion debe utilizarse dentro de AutenticacionProvider',
    );
  }

  return contexto;
}
