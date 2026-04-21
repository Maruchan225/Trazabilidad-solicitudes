import { ApiError } from '@/servicios/api/client';

export function obtenerMensajeError(error: unknown, mensajePorDefecto: string) {
  if (!(error instanceof Error)) {
    return mensajePorDefecto;
  }

  const mensaje = error.message?.trim();
  return mensaje ? mensaje : mensajePorDefecto;
}

export function normalizarTextoRequerido(valor: string) {
  return valor.trim();
}

export function normalizarTextoOpcional(valor?: string | null) {
  const texto = valor?.trim();
  return texto ? texto : undefined;
}

export function esErrorApiConEstado(error: unknown, statusCode: number) {
  return error instanceof ApiError && error.statusCode === statusCode;
}

export function mensajeContiene(error: unknown, texto: string) {
  return error instanceof Error && error.message.toLowerCase().includes(texto.toLowerCase());
}
