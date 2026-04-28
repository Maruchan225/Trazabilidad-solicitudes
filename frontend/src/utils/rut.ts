export function formatRut(value: string) {
  const cleanRut = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 2) return cleanRut;

  const body = cleanRut.slice(0, -1);
  const verifier = cleanRut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${verifier}`;
}
