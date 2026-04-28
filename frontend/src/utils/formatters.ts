export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-CL');
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-CL');
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  return `${Math.round(size / 1024)} KB`;
}
