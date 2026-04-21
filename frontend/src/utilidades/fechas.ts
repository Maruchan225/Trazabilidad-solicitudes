function convertirFecha(valor?: string | null) {
  if (!valor) {
    return null;
  }

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

const formateadorFecha = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formateadorFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatearFecha(valor?: string | null) {
  const fecha = convertirFecha(valor);
  return fecha ? formateadorFecha.format(fecha) : 'Sin fecha';
}

export function formatearFechaHora(valor?: string | null) {
  const fecha = convertirFecha(valor);
  return fecha ? formateadorFechaHora.format(fecha) : 'Sin fecha';
}

export function compararFechas(
  fechaA?: string | null,
  fechaB?: string | null,
) {
  const tiempoA = convertirFecha(fechaA)?.getTime() ?? 0;
  const tiempoB = convertirFecha(fechaB)?.getTime() ?? 0;
  return tiempoA - tiempoB;
}
