import type { SesionAutenticada } from '@/tipos/autenticacion';

const CLAVE_SESION = 'trazabilidad-municipal.sesion';

export function guardarSesion(sesion: SesionAutenticada) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function obtenerSesionGuardada(): SesionAutenticada | null {
  const valor = localStorage.getItem(CLAVE_SESION);

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(valor) as SesionAutenticada;
  } catch {
    limpiarSesionGuardada();
    return null;
  }
}

export function obtenerTokenGuardado() {
  return obtenerSesionGuardada()?.accessToken ?? null;
}

export function limpiarSesionGuardada() {
  localStorage.removeItem(CLAVE_SESION);
}
