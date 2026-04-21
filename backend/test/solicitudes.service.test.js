require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { EstadoSolicitud, PrioridadSolicitud, RolUsuario } = require('@prisma/client');
const { SolicitudesService } = require('../dist/src/solicitudes/solicitudes.service.js');

test('SolicitudesService.listar conserva visibilidad del trabajador aun con busqueda', async () => {
  let findManyArgs;

  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 7,
        activo: true,
      }),
    },
    solicitud: {
      findMany: async (args) => {
        findManyArgs = args;
        return [];
      },
    },
  };

  const service = new SolicitudesService(prisma);

  await service.listar(
    {
      id: 7,
      correo: 'trabajador@demo.cl',
      rol: RolUsuario.TRABAJADOR,
      areaId: 3,
    },
    {
      busqueda: '15',
      estado: EstadoSolicitud.VENCIDA,
      prioridad: PrioridadSolicitud.ALTA,
    },
  );

  assert.ok(Array.isArray(findManyArgs.where.AND));
  assert.deepEqual(findManyArgs.where.AND[0], { eliminadoEn: null });
  assert.deepEqual(findManyArgs.where.AND[1], {
    OR: [{ asignadoAId: 7 }, { areaActualId: 3 }],
  });
  assert.equal(findManyArgs.where.AND[2].prioridad, PrioridadSolicitud.ALTA);
  assert.deepEqual(findManyArgs.where.AND[2].fechaCierre, null);
  assert.equal(findManyArgs.where.AND[2].OR.at(-1).id, 15);
});

test('SolicitudesService.cerrarSolicitud exige estado FINALIZADA', async () => {
  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 1,
        activo: true,
      }),
    },
    solicitud: {
      findFirst: async () => ({
        id: 9,
        estado: EstadoSolicitud.EN_PROCESO,
        prioridad: PrioridadSolicitud.MEDIA,
        fechaVencimiento: new Date(),
        fechaCierre: null,
        creadoPorId: 1,
        asignadoAId: 2,
        areaActualId: 3,
        tipoSolicitudId: 4,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        eliminadoEn: null,
        creadoPor: { id: 1, nombres: 'A', apellidos: 'B', area: { id: 1 } },
        asignadoA: { id: 2, nombres: 'C', apellidos: 'D', area: { id: 3 } },
        areaActual: { id: 3, nombre: 'Obras' },
        tipoSolicitud: { id: 4, nombre: 'Oficio' },
      }),
    },
    $transaction: async (callback) => callback({}),
  };

  const service = new SolicitudesService(prisma);

  await assert.rejects(
    service.cerrarSolicitud(
      9,
      { comentario: 'Cerrar' },
      { id: 1, correo: 'encargado@demo.cl', rol: RolUsuario.ENCARGADO, areaId: 1 },
    ),
    /Solo se puede cerrar una solicitud que este en estado FINALIZADA/,
  );
});

test('SolicitudesService.listar aplica paginacion opcional sin perder filtros', async () => {
  let findManyArgs;

  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 1,
        activo: true,
      }),
    },
    solicitud: {
      findMany: async (args) => {
        findManyArgs = args;
        return [];
      },
    },
  };

  const service = new SolicitudesService(prisma);

  await service.listar(
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
    {
      limite: 25,
      offset: 50,
      prioridad: PrioridadSolicitud.MEDIA,
    },
  );

  assert.equal(findManyArgs.take, 25);
  assert.equal(findManyArgs.skip, 50);
  assert.equal(findManyArgs.where.AND[1].prioridad, PrioridadSolicitud.MEDIA);
});
