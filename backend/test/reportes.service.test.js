require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { EstadoSolicitud, PrioridadSolicitud } = require('@prisma/client');
const { ReportesService } = require('../dist/src/reportes/reportes.service.js');

test('ReportesService.obtenerDashboardTrabajador resume solicitudes asignadas al trabajador', async () => {
  const llamadas = [];
  const prisma = {
    solicitud: {
      count: async ({ where }) => {
        llamadas.push(where);

        if (where.estado?.in) {
          return 2;
        }

        if (where.estado === EstadoSolicitud.EN_PROCESO) {
          return 3;
        }

        if (where.estado === EstadoSolicitud.CERRADA) {
          return 4;
        }

        if (where.fechaVencimiento?.gte && where.fechaVencimiento?.lte) {
          return 1;
        }

        if (where.fechaVencimiento?.lt) {
          return 2;
        }

        if (where.fechaCierre === null) {
          return 5;
        }

        return 0;
      },
    },
  };

  const service = new ReportesService(prisma);

  const resultado = await service.obtenerDashboardTrabajador({
    id: 7,
    correo: 'trabajador@demo.cl',
    rol: 'TRABAJADOR',
    areaId: 2,
  });

  assert.deepEqual(resultado, {
    solicitudesNuevas: 2,
    solicitudesEnProceso: 3,
    solicitudesCerradas: 4,
    solicitudesPorVencer: 1,
    solicitudesVencidas: 2,
    solicitudesACargo: 5,
  });

  assert.equal(llamadas.length, 6);
  assert.equal(llamadas[0].asignadoAId, 7);
  assert.equal(llamadas[5].fechaCierre, null);
});

test('ReportesService.obtenerSolicitudesPorPrioridad entrega todas las prioridades con su cantidad', async () => {
  const prisma = {
    solicitud: {
      groupBy: async () => [
        { prioridad: PrioridadSolicitud.MEDIA, _count: { _all: 3 } },
        { prioridad: PrioridadSolicitud.URGENTE, _count: { _all: 1 } },
      ],
    },
  };

  const service = new ReportesService(prisma);

  const resultado = await service.obtenerSolicitudesPorPrioridad({});

  assert.deepEqual(resultado, [
    { prioridad: PrioridadSolicitud.BAJA, cantidad: 0 },
    { prioridad: PrioridadSolicitud.MEDIA, cantidad: 3 },
    { prioridad: PrioridadSolicitud.ALTA, cantidad: 0 },
    { prioridad: PrioridadSolicitud.URGENTE, cantidad: 1 },
  ]);
});

test('ReportesService.obtenerCargaPorTrabajador resume la carga operativa por usuario', async () => {
  let findManyArgs;

  const prisma = {
    usuario: {
      findMany: async (args) => {
        findManyArgs = args;
        return [
          {
            id: 9,
            nombres: 'Ana',
            apellidos: 'Suarez',
            solicitudesAsignadas: [
              {
                id: 1,
                estado: EstadoSolicitud.EN_PROCESO,
                fechaCierre: null,
                fechaVencimiento: new Date(Date.now() + 86400000),
              },
              {
                id: 2,
                estado: EstadoSolicitud.CERRADA,
                fechaCierre: new Date(),
                fechaVencimiento: new Date(Date.now() - 86400000),
              },
            ],
          },
        ];
      },
    },
  };

  const service = new ReportesService(prisma);
  const resultado = await service.obtenerCargaPorTrabajador({
    trabajadorId: 9,
  });

  assert.equal(findManyArgs.where.areaId, undefined);
  assert.deepEqual(resultado, [
    {
      trabajadorId: 9,
      nombreCompleto: 'Ana Suarez',
      totalAsignadas: 2,
      enProceso: 1,
      pendientesInformacion: 0,
      finalizadas: 0,
      cerradas: 1,
      vencidas: 0,
    },
  ]);
});
