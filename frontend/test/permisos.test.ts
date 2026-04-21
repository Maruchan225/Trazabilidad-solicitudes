import assert from 'node:assert/strict';
import test from 'node:test';
import {
  obtenerRutaInicialPorRol,
  obtenerRutaSeguraPorRol,
  rutaPermitidaParaRol,
} from '../src/utilidades/permisos.js';

test('el login envia al trabajador a solicitudes como ruta inicial segura', () => {
  assert.equal(obtenerRutaInicialPorRol('TRABAJADOR'), '/solicitudes');
  assert.equal(
    obtenerRutaSeguraPorRol('/usuarios', 'TRABAJADOR'),
    '/solicitudes',
  );
});

test('las rutas protegidas del trabajador solo permiten solicitudes y su detalle', () => {
  assert.equal(rutaPermitidaParaRol('/solicitudes', 'TRABAJADOR'), true);
  assert.equal(rutaPermitidaParaRol('/solicitudes/15', 'TRABAJADOR'), true);
  assert.equal(rutaPermitidaParaRol('/dashboard', 'TRABAJADOR'), false);
  assert.equal(rutaPermitidaParaRol('/usuarios', 'TRABAJADOR'), false);
});

test('los roles de gestion conservan rutas de destino y acceso administrativo', () => {
  assert.equal(obtenerRutaInicialPorRol('ENCARGADO'), '/dashboard');
  assert.equal(
    obtenerRutaSeguraPorRol('/usuarios/8', 'ENCARGADO'),
    '/usuarios/8',
  );
  assert.equal(rutaPermitidaParaRol('/reportes', 'REEMPLAZO'), true);
});
