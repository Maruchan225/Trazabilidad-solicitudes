import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { autenticacionService } from '@/servicios/autenticacion/autenticacion.service';
import {
  guardarSesion,
  limpiarSesionGuardada,
  obtenerSesionGuardada,
} from '@/servicios/autenticacion/autenticacion.storage';
import type {
  CredencialesLogin,
  SesionAutenticada,
} from '@/tipos/autenticacion';

type AutenticacionContextValue = {
  sesion: SesionAutenticada | null;
  autenticado: boolean;
  iniciarSesion: (credenciales: CredencialesLogin) => Promise<SesionAutenticada>;
  cerrarSesion: () => void;
};

export const AutenticacionContext =
  createContext<AutenticacionContextValue | null>(null);

export function AutenticacionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sesion, setSesion] = useState<SesionAutenticada | null>(null);

  useEffect(() => {
    setSesion(obtenerSesionGuardada());
  }, []);

  async function iniciarSesion(credenciales: CredencialesLogin) {
    const nuevaSesion = await autenticacionService.iniciarSesion(credenciales);
    guardarSesion(nuevaSesion);
    setSesion(nuevaSesion);
    return nuevaSesion;
  }

  function cerrarSesion() {
    limpiarSesionGuardada();
    setSesion(null);
  }

  const value = useMemo(
    () => ({
      sesion,
      autenticado: Boolean(sesion?.accessToken),
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion],
  );

  return (
    <AutenticacionContext.Provider value={value}>
      {children}
    </AutenticacionContext.Provider>
  );
}
