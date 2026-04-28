require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException } = require('@nestjs/common');
const { TiposSolicitudService } = require(
  '../dist/src/tipos-solicitud/tipos-solicitud.service.js'
);

test('TiposSolicitudService mantiene el catalogo en modo solo lectura para escrituras', async () => {
  const prisma = {
    tipoSolicitud: {
      create: async () => {
        throw new Error('No deberia intentar create');
      },
      update: async () => {
        throw new Error('No deberia intentar update');
      },
      delete: async () => {
        throw new Error('No deberia intentar remove');
      },
      findUnique: async () => ({ id: 1, nombre: 'Certificado', activo: true }),
    },
  };

  const service = new TiposSolicitudService(prisma);

  await assert.rejects(
    service.create({ nombre: 'Temporal', diasSla: 5 }),
    (error) =>
      error instanceof ForbiddenException &&
      /configuracion inicial de DOM/i.test(error.message),
  );

  await assert.rejects(
    service.update(1, { nombre: 'Ajustado' }),
    (error) =>
      error instanceof ForbiddenException &&
      /configuracion inicial de DOM/i.test(error.message),
  );

  await assert.rejects(
    service.remove(1),
    (error) =>
      error instanceof ForbiddenException &&
      /configuracion inicial de DOM/i.test(error.message),
  );
});
