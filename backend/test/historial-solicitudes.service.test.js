require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { HistorialSolicitudesService } = require(
  '../dist/src/historial-solicitudes/historial-solicitudes.service.js'
);

test('HistorialSolicitudesService.list sanea el usuario relacionado', async () => {
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
  await service.list();

  assert.equal(findManyArgs.include.usuario.omit.contrasena, true);
});

test('HistorialSolicitudesService.listByRequest limita visibilidad del trabajador al responsable asignado', async () => {
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
  await service.listByRequest(22, {
    id: 7,
    correo: 'trabajador@demo.cl',
    rol: 'TRABAJADOR',
    areaId: 3,
  });

  assert.deepEqual(findManyArgs.where, {
    solicitudId: 22,
    solicitud: {
      eliminadoEn: null,
      asignadoAId: 7,
    },
  });
});
