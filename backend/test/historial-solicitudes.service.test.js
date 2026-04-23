require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { HistorialSolicitudesService } = require(
  '../dist/src/historial-solicitudes/historial-solicitudes.service.js'
);

test('HistorialSolicitudesService.listar sanea el usuario relacionado', async () => {
  let findManyArgs;

  const prisma = {
    historialSolicitud: {
      findMany: async (args) => {
        findManyArgs = args;
        return [];
      },
    },
  };

  const service = new HistorialSolicitudesService(prisma);
  await service.listar();

  assert.equal(findManyArgs.include.usuario.omit.contrasena, true);
});
