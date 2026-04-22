require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AccionHistorialSolicitud,
  EstadoSolicitud,
  PrioridadSolicitud,
  RolUsuario,
} = require('@prisma/client');
const {
  combinarFiltrosSolicitud,
  construirFiltroConsultaSolicitudes,
} = require('../dist/src/solicitudes/solicitudes-filtros.js');
const {
  obtenerAccionHistorialCambioEstado,
  validarCambioEstadoPermitido,
  validarSolicitudCerrable,
  validarSolicitudFinalizable,
  validarTrabajadorPuedeOperarSolicitud,
} = require('../dist/src/solicitudes/solicitudes-flujo.js');
const {
  estaSolicitudVencida,
  presentarSolicitud,
} = require('../dist/src/solicitudes/solicitudes-presentacion.js');

test('construirFiltroConsultaSolicitudes arma busqueda numerica y vencidas', () => {
  const filtro = construirFiltroConsultaSolicitudes({
    busqueda: '42',
    estado: EstadoSolicitud.VENCIDA,
    prioridad: PrioridadSolicitud.ALTA,
    areaId: 7,
  });

  assert.equal(filtro.prioridad, PrioridadSolicitud.ALTA);
  assert.equal(filtro.areaActualId, 7);
  assert.equal(filtro.fechaCierre, null);
  assert.equal(filtro.OR.at(-1).id, 42);
});

test('combinarFiltrosSolicitud ignora objetos vacios y conserva AND cuando aplica', () => {
  const combinado = combinarFiltrosSolicitud(
    {},
    { eliminadoEn: null },
    { prioridad: PrioridadSolicitud.MEDIA },
  );

  assert.deepEqual(combinado, {
    AND: [{ eliminadoEn: null }, { prioridad: PrioridadSolicitud.MEDIA }],
  });
});

test('validarCambioEstadoPermitido mantiene restricciones del flujo', async () => {
  assert.throws(
    () =>
      validarCambioEstadoPermitido(
        {
          estado: EstadoSolicitud.FINALIZADA,
          asignadoAId: 10,
        },
        EstadoSolicitud.EN_PROCESO,
        {
          id: 10,
          correo: 'trabajador@demo.cl',
          rol: RolUsuario.TRABAJADOR,
          areaId: 4,
        },
      ),
    /solo puede ser cerrada por un encargado o reemplazo/i,
  );

  assert.throws(
    () =>
      validarCambioEstadoPermitido(
        {
          estado: EstadoSolicitud.INGRESADA,
          asignadoAId: null,
        },
        EstadoSolicitud.EN_PROCESO,
        {
          id: 1,
          correo: 'encargado@demo.cl',
          rol: RolUsuario.ENCARGADO,
          areaId: 1,
        },
      ),
    /debe estar asignada a un trabajador/i,
  );
});

test('validarSolicitudFinalizable y validarSolicitudCerrable protegen reglas terminales', () => {
  assert.throws(
    () =>
      validarSolicitudFinalizable({
        estado: EstadoSolicitud.FINALIZADA,
        asignadoAId: 2,
      }),
    /ya se encuentra finalizada/i,
  );

  assert.throws(
    () =>
      validarSolicitudCerrable({
        estado: EstadoSolicitud.EN_PROCESO,
      }),
    /Solo se puede cerrar una solicitud que este en estado FINALIZADA/,
  );
});

test('validarTrabajadorPuedeOperarSolicitud y accion de historial siguen consistentes', () => {
  assert.throws(
    () =>
      validarTrabajadorPuedeOperarSolicitud(
        { asignadoAId: 8 },
        {
          id: 9,
          correo: 'otro@demo.cl',
          rol: RolUsuario.TRABAJADOR,
          areaId: 1,
        },
      ),
    /Solo el trabajador asignado puede operar esta solicitud/,
  );

  assert.equal(
    obtenerAccionHistorialCambioEstado(EstadoSolicitud.FINALIZADA),
    AccionHistorialSolicitud.FINALIZADA,
  );
  assert.equal(
    obtenerAccionHistorialCambioEstado(EstadoSolicitud.EN_PROCESO),
    AccionHistorialSolicitud.ESTADO_CAMBIADO,
  );
});

test('presentarSolicitud conserva estado persistido y marca vencimiento visible', () => {
  const solicitud = presentarSolicitud({
    estado: EstadoSolicitud.EN_PROCESO,
    fechaVencimiento: new Date(Date.now() - 60_000),
    fechaCierre: null,
    titulo: 'Solicitud demo',
  });

  assert.equal(estaSolicitudVencida(solicitud), true);
  assert.equal(solicitud.estadoPersistido, EstadoSolicitud.EN_PROCESO);
  assert.equal(solicitud.estadoActual, EstadoSolicitud.VENCIDA);
  assert.equal(solicitud.estaVencida, true);
});
