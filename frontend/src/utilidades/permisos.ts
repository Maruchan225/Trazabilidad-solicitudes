import type { RolUsuario } from '../tipos/comun.js';

const ROLES_GESTION: RolUsuario[] = ['ENCARGADO', 'REEMPLAZO'];
const RUTAS_PERMITIDAS_TRABAJADOR = ['/solicitudes'];

export function tieneAlgunRol(
  rolActual: RolUsuario | undefined,
  rolesPermitidos: RolUsuario[],
) {
  return Boolean(rolActual && rolesPermitidos.includes(rolActual));
}

export function puedeGestionarCatalogos(rolActual?: RolUsuario) {
  return tieneAlgunRol(rolActual, ROLES_GESTION);
}

export function puedeGestionarSolicitudes(rolActual?: RolUsuario) {
  return tieneAlgunRol(rolActual, ROLES_GESTION);
}

export function puedeCrearSolicitudes(rolActual?: RolUsuario) {
  return tieneAlgunRol(rolActual, ROLES_GESTION);
}

export function esRolTrabajador(rolActual?: RolUsuario) {
  return rolActual === 'TRABAJADOR';
}

export function obtenerRutaInicialPorRol(rolActual?: RolUsuario) {
  return esRolTrabajador(rolActual) ? '/solicitudes' : '/dashboard';
}

export function rutaPermitidaParaRol(
  pathname: string,
  rolActual?: RolUsuario,
) {
  if (!esRolTrabajador(rolActual)) {
    return true;
  }

  return RUTAS_PERMITIDAS_TRABAJADOR.some(
    (rutaBase) =>
      pathname === rutaBase || pathname.startsWith(`${rutaBase}/`),
  );
}

export function obtenerRutaSeguraPorRol(
  pathname: string | undefined,
  rolActual?: RolUsuario,
) {
  if (!pathname) {
    return obtenerRutaInicialPorRol(rolActual);
  }

  return rutaPermitidaParaRol(pathname, rolActual)
    ? pathname
    : obtenerRutaInicialPorRol(rolActual);
}
