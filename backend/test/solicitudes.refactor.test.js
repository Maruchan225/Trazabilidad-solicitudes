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
  buildRequestsQueryFilter,
  combineRequestFilters,
} = require('../dist/src/solicitudes/solicitudes-filtros.js');
const {
  getHistoryActionForStatusChange,
  validateRequestClosable,
  validateRequestFinalizable,
  validateStatusChangeAllowed,
  validateWorkerCanOperateRequest,
  validateWorkerCanViewRequest,
} = require('../dist/src/solicitudes/solicitudes-flujo.js');
const {
  isRequestOverdue,
  presentRequest,
} = require('../dist/src/solicitudes/solicitudes-presentacion.js');

test('buildRequestsQueryFilter arma busqueda numerica y vencidas', () => {
  const filtro = buildRequestsQueryFilter({
    busqueda: '42',
    estado: EstadoSolicitud.VENCIDA,
    prioridad: PrioridadSolicitud.ALTA,
  });

  assert.equal(filtro.prioridad, PrioridadSolicitud.ALTA);
  assert.equal(filtro.fechaCierre, null);
  assert.ok(filtro.OR.some((item) => item.id === 42));
  assert.ok(filtro.OR.some((item) => item.correlativo === 42));
});

test('combineRequestFilters ignora objetos vacios y conserva AND cuando aplica', () => {
  const combinado = combineRequestFilters(
    {},
    { eliminadoEn: null },
    { prioridad: PrioridadSolicitud.MEDIA },
  );

  assert.deepEqual(combinado, {
    AND: [{ eliminadoEn: null }, { prioridad: PrioridadSolicitud.MEDIA }],
  });
});

test('validateStatusChangeAllowed mantiene restricciones del flujo', async () => {
  assert.throws(
    () =>
      validateStatusChangeAllowed(
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
      validateStatusChangeAllowed(
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

test('validateRequestFinalizable y validateRequestClosable protegen reglas terminales', () => {
  assert.throws(
    () =>
      validateRequestFinalizable({
        estado: EstadoSolicitud.FINALIZADA,
        asignadoAId: 2,
      }),
    /ya se encuentra finalizada/i,
  );

  assert.throws(
    () =>
      validateRequestClosable({
        estado: EstadoSolicitud.EN_PROCESO,
      }),
    /Solo se puede cerrar una solicitud que este en estado FINALIZADA/,
  );
});

test('validateWorkerCanOperateRequest y la accion de historial siguen consistentes', () => {
  assert.throws(
    () =>
      validateWorkerCanOperateRequest(
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
    getHistoryActionForStatusChange(EstadoSolicitud.FINALIZADA),
    AccionHistorialSolicitud.FINALIZADA,
  );
  assert.equal(
    getHistoryActionForStatusChange(EstadoSolicitud.EN_PROCESO),
    AccionHistorialSolicitud.ESTADO_CAMBIADO,
  );
});

test('validateWorkerCanViewRequest solo permite acceso al responsable asignado', () => {
  assert.throws(
    () =>
      validateWorkerCanViewRequest(
        { asignadoAId: 8 },
        {
          id: 9,
          correo: 'otro@demo.cl',
          rol: RolUsuario.TRABAJADOR,
          areaId: 8,
        },
      ),
    /No tiene permisos para acceder a esta solicitud/,
  );
});

test('presentRequest conserva estado persistido y marca vencimiento visible', () => {
  const solicitud = presentRequest({
    estado: EstadoSolicitud.EN_PROCESO,
    fechaVencimiento: new Date(Date.now() - 60_000),
    fechaCierre: null,
    titulo: 'Solicitud demo',
  });

  assert.equal(isRequestOverdue(solicitud), true);
  assert.equal(solicitud.estadoPersistido, EstadoSolicitud.EN_PROCESO);
  assert.equal(solicitud.estadoActual, EstadoSolicitud.VENCIDA);
  assert.equal(solicitud.estaVencida, true);
});
