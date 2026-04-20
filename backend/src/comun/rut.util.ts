export function normalizarRut(valor?: string | null) {
  const limpio = valor?.replace(/[^0-9kK]/g, '').toUpperCase();

  if (!limpio || !/^\d{7,8}[0-9K]$/.test(limpio)) {
    return undefined;
  }

  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

export function normalizarRutEntrada(valor: unknown) {
  if (typeof valor !== 'string') {
    return valor;
  }

  return normalizarRut(valor) ?? valor.trim().toUpperCase();
}
