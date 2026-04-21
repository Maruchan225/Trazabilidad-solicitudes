import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { obtenerDirectorioAdjuntos } from './adjuntos-storage.config';

const MIME_TYPES_PERMITIDOS = new Map<string, string>([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.docx',
  ],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
]);

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;
const DIRECTORIO_ADJUNTOS = obtenerDirectorioAdjuntos();

function asegurarDirectorioAdjuntos() {
  if (!existsSync(DIRECTORIO_ADJUNTOS)) {
    mkdirSync(DIRECTORIO_ADJUNTOS, { recursive: true });
  }
}

export const opcionesMulterAdjuntos = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      asegurarDirectorioAdjuntos();
      callback(null, DIRECTORIO_ADJUNTOS);
    },
    filename: (_request, file, callback) => {
      const extension =
        MIME_TYPES_PERMITIDOS.get(file.mimetype) ??
        extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const nombreBase = file.originalname
        .replace(extname(file.originalname), '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

      callback(null, `${timestamp}-${nombreBase || 'adjunto'}${extension}`);
    },
  }),
  limits: {
    fileSize: TAMANO_MAXIMO_BYTES,
  },
  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!MIME_TYPES_PERMITIDOS.has(file.mimetype)) {
      callback(
        new BadRequestException(
          'Tipo de archivo no permitido. Use pdf, doc, docx, jpg, jpeg o png.',
        ) as unknown as Error,
        false,
      );
      return;
    }

    callback(null, true);
  },
};
