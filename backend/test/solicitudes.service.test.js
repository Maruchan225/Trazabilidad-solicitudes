require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { EstadoSolicitud, PrioridadSolicitud, RolUsuario } = require('@prisma/client');
const { SolicitudesService } = require('../dist/src/solicitudes/solicitudes.service.js');

test('SolicitudesService.list conserva visibilidad del trabajador aun con busqueda', async () => {
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

  await service.list(
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
  assert.deepEqual(findManyArgs.where.AND[1], { asignadoAId: 7 });
  assert.equal(findManyArgs.where.AND[2].prioridad, PrioridadSolicitud.ALTA);
  assert.deepEqual(findManyArgs.where.AND[2].fechaCierre, null);
  assert.ok(findManyArgs.where.AND[2].OR.some((item) => item.id === 15));
  assert.ok(
    findManyArgs.where.AND[2].OR.some((item) => item.correlativo === 15),
  );
});

test('SolicitudesService.closeRequest exige estado FINALIZADA', async () => {
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
    service.closeRequest(
      9,
      { comentario: 'Cerrar' },
      { id: 1, correo: 'encargado@demo.cl', rol: RolUsuario.ENCARGADO, areaId: 1 },
    ),
    /Solo se puede cerrar una solicitud que este en estado FINALIZADA/,
  );
});

test('SolicitudesService.changeRequestStatus no permite cambios si la solicitud ya fue finalizada', async () => {
  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 2,
        activo: true,
      }),
    },
    solicitud: {
      findFirst: async () => ({
        id: 12,
        estado: EstadoSolicitud.FINALIZADA,
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
  };

  const service = new SolicitudesService(prisma);

  await assert.rejects(
    service.changeRequestStatus(
      12,
      {
        estado: EstadoSolicitud.EN_PROCESO,
        comentario: 'Intento de reapertura',
      },
      {
        id: 2,
        correo: 'trabajador@demo.cl',
        rol: RolUsuario.TRABAJADOR,
        areaId: 3,
      },
    ),
    /solo puede ser cerrada por un encargado o reemplazo/i,
  );
});

test('SolicitudesService.changeRequestStatus permite a un encargado update una solicitud finalizada', async () => {
  let estadoActualizado;
  let historialCreado;

  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 1,
        activo: true,
      }),
      findMany: async () => [],
    },
    solicitud: {
      findFirst: async () => ({
        id: 15,
        estado: EstadoSolicitud.FINALIZADA,
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
      update: async ({ data }) => {
        estadoActualizado = data.estado;
        return {};
      },
    },
    historialSolicitud: {
      create: async ({ data }) => {
        historialCreado = data;
        return data;
      },
    },
    $transaction: async (callback) =>
      callback({
        solicitud: prisma.solicitud,
        historialSolicitud: prisma.historialSolicitud,
      }),
  };

  const service = new SolicitudesService(prisma);
  service.getDetails = async () => ({ id: 15, estadoActual: EstadoSolicitud.EN_PROCESO });

  await service.changeRequestStatus(
    15,
    {
      estado: EstadoSolicitud.EN_PROCESO,
      comentario: 'Se reabre para nueva revision',
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  assert.equal(estadoActualizado, EstadoSolicitud.EN_PROCESO);
  assert.equal(historialCreado.accion, 'ESTADO_CAMBIADO');
  assert.equal(historialCreado.estadoOrigen, EstadoSolicitud.FINALIZADA);
  assert.equal(historialCreado.estadoDestino, EstadoSolicitud.EN_PROCESO);
});

test('SolicitudesService.changeRequestStatus permite a gestion marcar una solicitud como FINALIZADA', async () => {
  let estadoActualizado;
  let historialCreado;

  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 1,
        activo: true,
      }),
      findMany: async () => [],
    },
    solicitud: {
      findFirst: async () => ({
        id: 18,
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
      update: async ({ data }) => {
        estadoActualizado = data.estado;
        return {};
      },
    },
    historialSolicitud: {
      create: async ({ data }) => {
        historialCreado = data;
        return data;
      },
    },
    $transaction: async (callback) =>
      callback({
        solicitud: prisma.solicitud,
        historialSolicitud: prisma.historialSolicitud,
      }),
  };

  const service = new SolicitudesService(prisma);
  service.getDetails = async () => ({ id: 18, estadoActual: EstadoSolicitud.FINALIZADA });

  await service.changeRequestStatus(
    18,
    {
      estado: EstadoSolicitud.FINALIZADA,
      comentario: 'Se marca como finalizada desde gestion',
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  assert.equal(estadoActualizado, EstadoSolicitud.FINALIZADA);
  assert.equal(historialCreado.accion, 'FINALIZADA');
  assert.equal(historialCreado.estadoOrigen, EstadoSolicitud.EN_PROCESO);
  assert.equal(historialCreado.estadoDestino, EstadoSolicitud.FINALIZADA);
});

test('SolicitudesService.list aplica paginacion opcional sin perder filtros', async () => {
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

  await service.list(
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

test('SolicitudesService.list utiliza includes seguros para usuarios relacionados', async () => {
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

  await service.list(
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
    {},
  );

  assert.equal(findManyArgs.include.creadoPor.omit.contrasena, true);
  assert.equal(findManyArgs.include.asignadoA.omit.contrasena, true);
  assert.equal(findManyArgs.include.creadoPor.include.area, true);
});
