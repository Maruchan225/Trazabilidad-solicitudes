require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  AccionHistorialSolicitud,
  EstadoSolicitud,
  RolUsuario,
} = require('@prisma/client');
const {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');
const { AdjuntosService } = require('../dist/src/adjuntos/adjuntos.service.js');

function crearSolicitudVisible() {
  return {
    id: 12,
    estado: EstadoSolicitud.EN_PROCESO,
    areaActualId: 5,
    asignadoAId: 8,
    eliminadoEn: null,
  };
}

test('AdjuntosService.subirAdjunto rechaza archivos ausentes', async () => {
  const service = new AdjuntosService({});

  await assert.rejects(
    service.subirAdjunto(
      12,
      undefined,
      { id: 8, correo: 'trabajador@demo.cl', rol: RolUsuario.TRABAJADOR, areaId: 5 },
    ),
    (error) =>
      error instanceof BadRequestException &&
      /Debe adjuntar un archivo valido/.test(error.message),
  );
});

test('AdjuntosService.subirAdjunto registra adjunto e historial', async () => {
  const registros = [];
  const solicitud = crearSolicitudVisible();

  const prisma = {
    solicitud: {
      findFirst: async () => solicitud,
    },
    adjunto: {
      create: async ({ data }) => ({
        id: 90,
        ...data,
        creadoEn: new Date(),
        subidoPor: {
          id: 8,
          nombres: 'Ana',
          apellidos: 'Perez',
          area: { id: 5, nombre: 'Obras' },
        },
      }),
    },
    historialSolicitud: {
      create: async ({ data }) => {
        registros.push(data);
        return data;
      },
    },
    $transaction: async (callback) =>
      callback({
        adjunto: prisma.adjunto,
        historialSolicitud: prisma.historialSolicitud,
      }),
  };

  const service = new AdjuntosService(prisma);
  const resultado = await service.subirAdjunto(
    12,
    {
      originalname: 'informe final.pdf',
      filename: '1715000000-informe-final.pdf',
      path: 'uploads\\adjuntos\\1715000000-informe-final.pdf',
      mimetype: 'application/pdf',
      size: 2048,
    },
    { id: 8, correo: 'trabajador@demo.cl', rol: RolUsuario.TRABAJADOR, areaId: 5 },
  );

  assert.equal(resultado.nombreOriginal, 'informe final.pdf');
  assert.equal(
    resultado.ruta,
    'uploads/adjuntos/1715000000-informe-final.pdf',
  );
  assert.equal(registros.length, 1);
  assert.equal(registros[0].accion, AccionHistorialSolicitud.ADJUNTO_SUBIDO);
  assert.equal(registros[0].areaDestinoId, undefined);
});

test('AdjuntosService.eliminarAdjunto impide que un trabajador elimine archivos de otro usuario', async () => {
  const prisma = {
    adjunto: {
      findFirst: async () => ({
        id: 55,
        nombreOriginal: 'evidencia.png',
        ruta: 'C:/temporal/evidencia.png',
        solicitudId: 12,
        subidoPorId: 99,
        solicitud: crearSolicitudVisible(),
      }),
    },
  };

  const service = new AdjuntosService(prisma);

  await assert.rejects(
    service.eliminarAdjunto(
      55,
      { id: 8, correo: 'trabajador@demo.cl', rol: RolUsuario.TRABAJADOR, areaId: 5 },
    ),
    (error) =>
      error instanceof ForbiddenException &&
      /Solo puede eliminar adjuntos que usted haya subido/.test(error.message),
  );
});

test('AdjuntosService.obtenerArchivoAdjunto informa cuando el archivo fisico ya no existe', async () => {
  const carpetaTemporal = fs.mkdtempSync(
    path.join(os.tmpdir(), 'adjuntos-test-'),
  );
  const rutaInexistente = path.join(carpetaTemporal, 'faltante.pdf');

  const prisma = {
    adjunto: {
      findFirst: async () => ({
        id: 44,
        nombreOriginal: 'faltante.pdf',
        ruta: rutaInexistente,
        solicitudId: 12,
        subidoPorId: 8,
        solicitud: crearSolicitudVisible(),
      }),
    },
  };

  const service = new AdjuntosService(prisma);

  try {
    await assert.rejects(
      service.obtenerArchivoAdjunto(
        44,
        { id: 8, correo: 'trabajador@demo.cl', rol: RolUsuario.TRABAJADOR, areaId: 5 },
      ),
      (error) =>
        error instanceof NotFoundException &&
        /no se encuentra disponible/.test(error.message),
    );
  } finally {
    fs.rmSync(carpetaTemporal, { recursive: true, force: true });
  }
});
