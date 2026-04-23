require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { HttpException, HttpStatus } = require('@nestjs/common');
const {
  LoginRateLimitGuard,
} = require('../dist/src/autenticacion/guardias/login-rate-limit.guard.js');

function crearContextoRequest({
  email = 'persona@demo.cl',
  ip = '127.0.0.1',
} = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        body: { email },
        ip,
        headers: {},
        socket: { remoteAddress: ip },
      }),
    }),
  };
}

test('LoginRateLimitGuard bloquea cuando se supera el maximo de intentos recientes', () => {
  const guard = new LoginRateLimitGuard({
    get: (key, defaultValue) => {
      if (key === 'AUTH_LOGIN_MAX_ATTEMPTS') {
        return 2;
      }

      if (key === 'AUTH_LOGIN_WINDOW_MS') {
        return 60_000;
      }

      return defaultValue;
    },
  });

  assert.equal(guard.canActivate(crearContextoRequest()), true);
  assert.equal(guard.canActivate(crearContextoRequest()), true);
  assert.throws(
    () => guard.canActivate(crearContextoRequest()),
    (error) =>
      error instanceof HttpException &&
      error.getStatus() === HttpStatus.TOO_MANY_REQUESTS &&
      /Demasiados intentos de inicio de sesion/i.test(error.message),
  );
});

test('LoginRateLimitGuard separa intentos por correo e ip normalizados', () => {
  const guard = new LoginRateLimitGuard({
    get: (key, defaultValue) => {
      if (key === 'AUTH_LOGIN_MAX_ATTEMPTS') {
        return 1;
      }

      if (key === 'AUTH_LOGIN_WINDOW_MS') {
        return 60_000;
      }

      return defaultValue;
    },
  });

  assert.equal(
    guard.canActivate(
      crearContextoRequest({ email: 'Persona@Demo.cl ', ip: '10.0.0.1' }),
    ),
    true,
  );
  assert.equal(
    guard.canActivate(
      crearContextoRequest({ email: 'otra@demo.cl', ip: '10.0.0.1' }),
    ),
    true,
  );
  assert.equal(
    guard.canActivate(
      crearContextoRequest({ email: 'persona@demo.cl', ip: '10.0.0.2' }),
    ),
    true,
  );
});
