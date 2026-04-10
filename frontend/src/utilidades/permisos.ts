import type { RolUsuario } from '@/tipos/comun';

const ROLES_GESTION: RolUsuario[] = ['ENCARGADO', 'REEMPLAZO'];

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
