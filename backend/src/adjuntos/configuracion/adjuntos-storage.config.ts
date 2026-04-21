import { join, resolve } from 'path';

export function obtenerDirectorioAdjuntos() {
  const directorioConfigurado = process.env.ADJUNTOS_DIR?.trim();

  if (directorioConfigurado) {
    return resolve(directorioConfigurado);
  }

  return join(process.cwd(), 'uploads', 'adjuntos');
}
