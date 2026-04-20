import type { Usuario, UsuarioPayload } from '@/tipos/usuarios';
import {
  normalizarTextoOpcional,
  normalizarTextoRequerido,
} from '@/utilidades/crud';
import { normalizarRut } from '@/utilidades/rut';

export function obtenerValoresFormularioUsuario(
  usuario?: Usuario | null,
): Partial<UsuarioPayload> {
  if (!usuario) {
    return {
      rol: 'TRABAJADOR',
      activo: true,
      contrasena: undefined,
    };
  }

  return {
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    rut: usuario.rut,
    email: usuario.email,
    telefono: usuario.telefono ?? undefined,
    rol: usuario.rol,
    areaId: usuario.area.id,
    activo: usuario.activo,
    contrasena: undefined,
  };
}

export function construirPayloadUsuario(values: UsuarioPayload): UsuarioPayload {
  const contrasena = values.contrasena?.trim();

  return {
    nombres: normalizarTextoRequerido(values.nombres),
    apellidos: normalizarTextoRequerido(values.apellidos),
    rut: normalizarRut(values.rut) ?? normalizarTextoRequerido(values.rut),
    email: normalizarTextoRequerido(values.email).toLowerCase(),
    telefono: normalizarTextoOpcional(values.telefono),
    rol: values.rol,
    areaId: values.areaId,
    activo: values.activo ?? true,
    contrasena: normalizarTextoOpcional(contrasena),
  };
}
