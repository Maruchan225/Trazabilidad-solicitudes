require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AccionHistorialSolicitud,
  CanalIngreso,
  EstadoSolicitud,
  Prisma,
  PrioridadSolicitud,
  RolUsuario,
} = require('@prisma/client');
const { BadRequestException, ForbiddenException } = require('@nestjs/common');
const { SolicitudesService } = require('../dist/src/solicitudes/solicitudes.service.js');

function crearPrismaFlujoSolicitudes() {
  const usuarios = new Map([
    [
      1,
      {
        id: 1,
        nombres: 'Elena',
        apellidos: 'Gomez',
        email: 'encargado@demo.cl',
        activo: true,
        rol: RolUsuario.ENCARGADO,
        areaId: 1,
      },
    ],
    [
      2,
      {
        id: 2,
        nombres: 'Pablo',
        apellidos: 'Rojas',
        email: 'trabajador.partes@demo.cl',
        activo: true,
        rol: RolUsuario.TRABAJADOR,
        areaId: 1,
      },
    ],
    [
      3,
      {
        id: 3,
        nombres: 'Luisa',
        apellidos: 'Araya',
        email: 'trabajador.obras@demo.cl',
        activo: true,
        rol: RolUsuario.TRABAJADOR,
        areaId: 2,
      },
    ],
    [
      4,
      {
        id: 4,
        nombres: 'Nora',
        apellidos: 'Soto',
        email: 'trabajador.area@demo.cl',
        activo: true,
        rol: RolUsuario.TRABAJADOR,
        areaId: 2,
      },
    ],
  ]);

  const areas = new Map([
    [1, { id: 1, nombre: 'Partes', activo: true }],
    [2, { id: 2, nombre: 'Obras', activo: true }],
  ]);

  const tipos = new Map([
    [1, { id: 1, nombre: 'Oficio', activo: true, diasSla: 1 }],
    [2, { id: 2, nombre: 'Sin SLA', activo: true, diasSla: null }],
  ]);

  const estado = {
    historial: [],
    solicitud: null,
    nextSolicitudId: 101,
  };

  function clonarUsuario(id) {
    const usuario = usuarios.get(id);
    return usuario
      ? {
          ...usuario,
          area: { ...areas.get(usuario.areaId) },
        }
      : null;
  }

  function snapshotSolicitud() {
    if (!estado.solicitud) {
      return null;
    }

    return {
      ...estado.solicitud,
      creadoPor: clonarUsuario(estado.solicitud.creadoPorId),
      asignadoA: estado.solicitud.asignadoAId
        ? clonarUsuario(estado.solicitud.asignadoAId)
        : null,
      areaActual: { ...areas.get(estado.solicitud.areaActualId) },
      tipoSolicitud: { ...tipos.get(estado.solicitud.tipoSolicitudId) },
      historialEntradas: estado.historial.map((item) => ({ ...item })),
    };
  }

  function historialConRelaciones(data) {
    return {
      id: estado.historial.length + 1,
      ...data,
      creadoEn: new Date(),
      usuario: clonarUsuario(data.usuarioId),
      areaOrigen: data.areaOrigenId ? { ...areas.get(data.areaOrigenId) } : null,
      areaDestino: data.areaDestinoId
        ? { ...areas.get(data.areaDestinoId) }
        : null,
    };
  }

  function coincideSolicitudConWhere(solicitud, where) {
    if (!solicitud) {
      return false;
    }

    if (typeof where?.id === 'number' && where.id !== solicitud.id) {
      return false;
    }

    if (where?.eliminadoEn === null && solicitud.eliminadoEn !== null) {
      return false;
    }

    if (where?.OR) {
      return where.OR.some((condicion) =>
        coincideSolicitudConWhere(solicitud, condicion),
      );
    }

    return true;
  }

  const prisma = {
    usuario: {
      findUnique: async ({ where }) => {
        const usuario = usuarios.get(where.id);
        return usuario ? { ...usuario } : null;
      },
      findMany: async ({ where }) =>
        (where?.id?.in ?? []).map((id) => clonarUsuario(id)).filter(Boolean),
    },
    area: {
      findUnique: async ({ where }) => {
        const area = areas.get(where.id);
        return area ? { ...area } : null;
      },
    },
    tipoSolicitud: {
      findUnique: async ({ where }) => {
        const tipo = tipos.get(where.id);
        return tipo ? { ...tipo } : null;
      },
    },
    solicitud: {
      findFirst: async ({ where }) =>
        coincideSolicitudConWhere(estado.solicitud, where)
          ? snapshotSolicitud()
          : null,
      create: async ({ data }) => {
        estado.solicitud = {
          id: estado.nextSolicitudId++,
          numeroSolicitud: data.numeroSolicitud,
          correlativo: data.correlativo,
          canalIngreso: data.canalIngreso,
          titulo: data.titulo,
          descripcion: data.descripcion,
          estado: EstadoSolicitud.INGRESADA,
          prioridad: data.prioridad ?? PrioridadSolicitud.MEDIA,
          fechaVencimiento: data.fechaVencimiento,
          fechaCierre: null,
          eliminadoEn: null,
          creadoPorId: data.creadoPor.connect.id,
          asignadoAId: data.asignadoA?.connect?.id ?? null,
          areaActualId: data.areaActual.connect.id,
          tipoSolicitudId: data.tipoSolicitud.connect.id,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        };

        return snapshotSolicitud();
      },
      aggregate: async () => ({
        _max: {
          correlativo: estado.solicitud?.correlativo ?? null,
        },
      }),
      update: async ({ data }) => {
        estado.solicitud = {
          ...estado.solicitud,
          ...data,
          actualizadoEn: new Date(),
        };

        return snapshotSolicitud();
      },
    },
    historialSolicitud: {
      create: async ({ data }) => {
        const entrada = historialConRelaciones(data);
        estado.historial.push(entrada);
        return entrada;
      },
    },
    $transaction: async (callback) =>
      callback({
        solicitud: prisma.solicitud,
        historialSolicitud: prisma.historialSolicitud,
      }),
  };

  return { prisma, estado, snapshotSolicitud };
}

test('SolicitudesService cubre el flujo principal de crear, asignar, derivar a usuario, finalizar y cerrar', async () => {
  const { prisma, estado, snapshotSolicitud } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);
  service.verDetalle = async () => snapshotSolicitud();

  const encargado = {
    id: 1,
    correo: 'encargado@demo.cl',
    rol: RolUsuario.ENCARGADO,
    areaId: 1,
  };
  const trabajadorDestino = {
    id: 3,
    correo: 'trabajador.obras@demo.cl',
    rol: RolUsuario.TRABAJADOR,
    areaId: 2,
  };

  await service.crear(
    {
      numeroSolicitud: 'DOM-2026-001',
      titulo: 'Solicitud de retiro de escombros',
      descripcion: 'Se requiere apoyo de Obras para retiro en via publica.',
      prioridad: PrioridadSolicitud.ALTA,
      canalIngreso: CanalIngreso.PRESENCIAL,
      asignadoAId: 2,
      tipoSolicitudId: 1,
      comentario: 'Ingreso inicial',
    },
    encargado,
  );

  const solicitudId = estado.solicitud.id;

  await service.asignarSolicitud(
    solicitudId,
    { asignadoAId: 4, comentario: 'Reasignacion operativa inicial' },
    encargado,
  );

  await service.derivarSolicitudAUsuario(
    solicitudId,
    {
      asignadoAId: 3,
      comentario: 'Derivacion a nuevo responsable',
    },
    encargado,
  );

  await service.cambiarEstadoSolicitud(
    solicitudId,
    {
      estado: EstadoSolicitud.EN_PROCESO,
      comentario: 'Solicitud tomada por Obras',
    },
    trabajadorDestino,
  );

  await service.finalizarSolicitud(
    solicitudId,
    { comentario: 'Trabajo ejecutado' },
    trabajadorDestino,
  );

  await service.cerrarSolicitud(
    solicitudId,
    { comentario: 'Cierre conforme' },
    encargado,
  );

  assert.equal(estado.solicitud.areaActualId, 1);
  assert.equal(estado.solicitud.asignadoAId, 3);
  assert.equal(estado.solicitud.correlativo, 1);
  assert.equal(estado.solicitud.numeroSolicitud, 'DOM-2026-001');
  assert.equal(estado.solicitud.canalIngreso, CanalIngreso.PRESENCIAL);
  assert.equal(estado.solicitud.estado, EstadoSolicitud.CERRADA);
  assert.ok(estado.solicitud.fechaCierre instanceof Date);
  assert.ok(estado.solicitud.fechaVencimiento instanceof Date);
  assert.deepEqual(
    estado.historial.map((item) => item.accion),
    [
      AccionHistorialSolicitud.CREADA,
      AccionHistorialSolicitud.ASIGNADA,
      AccionHistorialSolicitud.DERIVADA,
      AccionHistorialSolicitud.ESTADO_CAMBIADO,
      AccionHistorialSolicitud.FINALIZADA,
      AccionHistorialSolicitud.CERRADA,
    ],
  );
});

test('SolicitudesService.crear calcula la fecha de vencimiento desde el SLA del tipo', async () => {
  const { prisma, estado } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);
  const ahora = Date.now();

  await service.crear(
    {
      numeroSolicitud: 'DOM-2026-002',
      titulo: 'Solicitud con vencimiento automatico',
      descripcion: 'Debe tomar la fecha a partir del SLA configurado.',
      prioridad: PrioridadSolicitud.MEDIA,
      canalIngreso: CanalIngreso.CORREO,
      tipoSolicitudId: 1,
      asignadoAId: 3,
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  const diferenciaMs = estado.solicitud.fechaVencimiento.getTime() - ahora;
  const unDiaMs = 24 * 60 * 60 * 1000;

  assert.equal(estado.solicitud.correlativo, 1);
  assert.equal(estado.solicitud.areaActualId, 2);
  assert.ok(diferenciaMs >= unDiaMs - 5_000);
  assert.ok(diferenciaMs <= unDiaMs + 5_000);
});

test('SolicitudesService.crear permite omitir numeroSolicitud y usa correlativo como identificador operativo', async () => {
  const { prisma, estado } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);

  await service.crear(
    {
      titulo: 'Solicitud sin numero externo',
      descripcion: 'Debe poder crearse sin numeroSolicitud manual.',
      prioridad: PrioridadSolicitud.MEDIA,
      canalIngreso: CanalIngreso.CORREO,
      asignadoAId: 2,
      tipoSolicitudId: 1,
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  assert.equal(estado.solicitud.correlativo, 1);
  assert.equal(estado.solicitud.numeroSolicitud, undefined);
});

test('SolicitudesService.crear exige responsable desde el alta', async () => {
  const { prisma } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);

  await assert.rejects(
    service.crear(
      {
        titulo: 'Solicitud sin responsable',
        descripcion: 'Debe rechazar cualquier solicitud nueva sin responsable.',
        prioridad: PrioridadSolicitud.MEDIA,
        canalIngreso: CanalIngreso.CORREO,
        tipoSolicitudId: 1,
      },
      {
        id: 1,
        correo: 'encargado@demo.cl',
        rol: RolUsuario.ENCARGADO,
        areaId: 1,
      },
    ),
    (error) =>
      error instanceof BadRequestException &&
      error.message === 'Debe asignar un responsable al crear la solicitud',
  );
});

test('SolicitudesService.crear rechaza tipos sin SLA configurado', async () => {
  const { prisma } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);

  await assert.rejects(
    service.crear(
      {
      numeroSolicitud: 'DOM-2026-003',
      titulo: 'Solicitud sin SLA',
      descripcion: 'Debe rechazar la creacion si el tipo no define SLA.',
      prioridad: PrioridadSolicitud.MEDIA,
      canalIngreso: CanalIngreso.PRESENCIAL,
      asignadoAId: 2,
      tipoSolicitudId: 2,
      },
      {
        id: 1,
        correo: 'encargado@demo.cl',
        rol: RolUsuario.ENCARGADO,
        areaId: 1,
      },
    ),
    /no tiene dias SLA configurados/i,
  );
});

test('SolicitudesService.crear normaliza y valida numeroSolicitud en backend', async () => {
  const { prisma, estado } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);

  await service.crear(
    {
      numeroSolicitud: '   DOM-2026-010   ',
      titulo: 'Solicitud con numero normalizado',
      descripcion: 'Debe persistir el numero de solicitud sin espacios externos.',
      prioridad: PrioridadSolicitud.MEDIA,
      canalIngreso: CanalIngreso.CORREO,
      asignadoAId: 2,
      tipoSolicitudId: 1,
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  assert.equal(estado.solicitud.numeroSolicitud, 'DOM-2026-010');

  await assert.rejects(
    service.crear(
      {
        numeroSolicitud: '   ',
        titulo: 'Solicitud invalida',
        descripcion: 'La validacion del backend debe rechazar solo espacios.',
        prioridad: PrioridadSolicitud.MEDIA,
        canalIngreso: CanalIngreso.PRESENCIAL,
        asignadoAId: 2,
        tipoSolicitudId: 1,
      },
      {
        id: 1,
        correo: 'encargado@demo.cl',
        rol: RolUsuario.ENCARGADO,
        areaId: 1,
      },
    ),
    (error) =>
      error instanceof BadRequestException &&
      error.message === 'La referencia externa no puede estar vacia',
  );
});

test('SolicitudesService.derivarSolicitudAUsuario deriva solo por usuario y conserva el area tecnica actual', async () => {
  const { prisma, estado, snapshotSolicitud } = crearPrismaFlujoSolicitudes();
  const service = new SolicitudesService(prisma);
  service.verDetalle = async () => snapshotSolicitud();

  await service.crear(
    {
      numeroSolicitud: 'DOM-2026-011',
      titulo: 'Solicitud para derivacion segura',
      descripcion: 'Se probara la derivacion solo entre usuarios.',
      prioridad: PrioridadSolicitud.ALTA,
      canalIngreso: CanalIngreso.PRESENCIAL,
      tipoSolicitudId: 1,
      asignadoAId: 2,
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  await service.derivarSolicitudAUsuario(
    estado.solicitud.id,
    {
      asignadoAId: 3,
      comentario: 'Derivacion valida',
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  assert.equal(estado.solicitud.asignadoAId, 3);
  assert.equal(estado.solicitud.areaActualId, 1);
  assert.equal(estado.historial.at(-1).areaDestinoId, undefined);
  assert.equal(estado.historial.at(-1).asignadoDestinoId, 3);
  assert.equal(estado.historial[0].areaDestinoId, undefined);
});

test('SolicitudesService.crear reintenta cuando ocurre un conflicto de correlativo', async () => {
  let intentoCreate = 0;
  let historialCreado = false;
  let maxCorrelativo = 0;

  const prisma = {
    usuario: {
      findUnique: async ({ where }) => {
        if (where.id === 1) {
          return { id: 1, activo: true, rol: RolUsuario.ENCARGADO, areaId: 1 };
        }

        if (where.id === 2) {
          return { id: 2, activo: true, rol: RolUsuario.TRABAJADOR, areaId: 1 };
        }

        return null;
      },
    },
    tipoSolicitud: {
      findUnique: async () => ({
        id: 1,
        activo: true,
        diasSla: 1,
      }),
    },
    area: {
      findUnique: async () => ({
        id: 1,
        activo: true,
      }),
    },
    solicitud: {
      findFirst: async () => ({
        id: 200,
        numeroSolicitud: 'DOM-2026-020',
        correlativo: 2,
        canalIngreso: CanalIngreso.CORREO,
        titulo: 'Solicitud con retry',
        descripcion: 'Debe persistir tras un conflicto de correlativo.',
        estado: EstadoSolicitud.INGRESADA,
        prioridad: PrioridadSolicitud.MEDIA,
        fechaVencimiento: new Date(),
        fechaCierre: null,
        eliminadoEn: null,
        creadoPorId: 1,
        asignadoAId: null,
        areaActualId: 1,
        tipoSolicitudId: 1,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        creadoPor: { id: 1, nombres: 'Elena', apellidos: 'Gomez', area: { id: 1 } },
        asignadoA: null,
        areaActual: { id: 1, nombre: 'Partes' },
        tipoSolicitud: { id: 1, nombre: 'Oficio' },
      }),
      aggregate: async () => ({
        _max: {
          correlativo: maxCorrelativo,
        },
      }),
      create: async ({ data }) => {
        intentoCreate += 1;

        if (intentoCreate === 1) {
          maxCorrelativo = 1;
          throw new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed on the fields: (`correlativo`)',
            {
              code: 'P2002',
              clientVersion: 'test',
              meta: { target: ['correlativo'] },
            },
          );
        }

        return {
          id: 200,
          estado: EstadoSolicitud.INGRESADA,
          areaActualId: 1,
          asignadoAId: data.asignadoA?.connect?.id ?? null,
          correlativo: data.correlativo,
        };
      },
    },
    historialSolicitud: {
      create: async () => {
        historialCreado = true;
        return {};
      },
    },
    $transaction: async (callback) =>
      callback({
        solicitud: prisma.solicitud,
        historialSolicitud: prisma.historialSolicitud,
      }),
  };

  const service = new SolicitudesService(prisma);
  service.verDetalle = async () => ({ id: 200 });

  await service.crear(
    {
      numeroSolicitud: 'DOM-2026-020',
      titulo: 'Solicitud con retry',
      descripcion: 'Debe persistir tras un conflicto de correlativo.',
      prioridad: PrioridadSolicitud.MEDIA,
      canalIngreso: CanalIngreso.CORREO,
      asignadoAId: 2,
      tipoSolicitudId: 1,
    },
    {
      id: 1,
      correo: 'encargado@demo.cl',
      rol: RolUsuario.ENCARGADO,
      areaId: 1,
    },
  );

  assert.equal(intentoCreate, 2);
  assert.equal(historialCreado, true);
});

test('SolicitudesService impide que un trabajador no asignado opere una solicitud', async () => {
  const { prisma, estado } = crearPrismaFlujoSolicitudes();
  estado.solicitud = {
    id: 77,
    titulo: 'Solicitud de inspeccion',
    descripcion: 'Revision de terreno',
    estado: EstadoSolicitud.INGRESADA,
    prioridad: PrioridadSolicitud.MEDIA,
    fechaVencimiento: new Date(Date.now() + 86400000),
    fechaCierre: null,
    eliminadoEn: null,
    creadoPorId: 1,
    asignadoAId: 3,
    areaActualId: 2,
    tipoSolicitudId: 1,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  const service = new SolicitudesService(prisma);

  await assert.rejects(
    service.cambiarEstadoSolicitud(
      77,
      { estado: EstadoSolicitud.EN_PROCESO, comentario: 'Intento no valido' },
      {
        id: 4,
        correo: 'trabajador.area@demo.cl',
        rol: RolUsuario.TRABAJADOR,
        areaId: 2,
      },
    ),
    (error) =>
      error instanceof ForbiddenException &&
      /Solo el trabajador asignado puede operar esta solicitud/.test(
        error.message,
      ),
  );
});
