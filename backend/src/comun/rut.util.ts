export function normalizeRut(value?: string | null) {
  const normalizedValue = value?.replace(/[^0-9kK]/g, '').toUpperCase();

  if (!normalizedValue || !/^\d{7,8}[0-9K]$/.test(normalizedValue)) {
    return undefined;
  }

  return `${normalizedValue.slice(0, -1)}-${normalizedValue.slice(-1)}`;
}

export function normalizeRutInput(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  return normalizeRut(value) ?? value.trim().toUpperCase();
}
