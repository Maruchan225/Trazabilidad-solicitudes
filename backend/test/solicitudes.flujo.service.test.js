require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AccionHistorialSolicitud,
  EstadoSolicitud,
  PrioridadSolicitud,
  RolUsuario,
} = require('@prisma/client');
const { ForbiddenException } = require('@nestjs/common');
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

  const tipos = new Map([[1, { id: 1, nombre: 'Oficio', activo: true }]]);

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

test('SolicitudesService cubre el flujo principal de crear, asignar, derivar, finalizar y cerrar', async () => {
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
      titulo: 'Solicitud de retiro de escombros',
      descripcion: 'Se requiere apoyo de Obras para retiro en via publica.',
      prioridad: PrioridadSolicitud.ALTA,
      fechaVencimiento: new Date(Date.now() + 86400000).toISOString(),
      areaActualId: 1,
      tipoSolicitudId: 1,
      comentario: 'Ingreso inicial',
    },
    encargado,
  );

  const solicitudId = estado.solicitud.id;

  await service.asignarSolicitud(
    solicitudId,
    { asignadoAId: 2, comentario: 'Asignacion inicial en Partes' },
    encargado,
  );

  await service.derivarSolicitudAArea(
    solicitudId,
    {
      areaDestinoId: 2,
      asignadoAId: 3,
      comentario: 'Derivacion a Obras',
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

  assert.equal(estado.solicitud.areaActualId, 2);
  assert.equal(estado.solicitud.asignadoAId, 3);
  assert.equal(estado.solicitud.estado, EstadoSolicitud.CERRADA);
  assert.ok(estado.solicitud.fechaCierre instanceof Date);
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

test('SolicitudesService impide que un trabajador del area opere una solicitud si no esta asignado', async () => {
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
