require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { UnauthorizedException } = require('@nestjs/common');
const { RolUsuario } = require('@prisma/client');
const {
  JwtStrategy,
} = require('../dist/src/autenticacion/estrategias/jwt.strategy.js');

test('JwtStrategy.validate rehidrata el usuario con el estado actual de base de datos', async () => {
  const configService = {
    getOrThrow: () => 'jwt-secret-demo',
  };
  const usuariosService = {
    findAuthContextById: async (id) => {
      assert.equal(id, 8);

      return {
        id: 8,
        email: 'actualizado@demo.cl',
        rol: RolUsuario.ENCARGADO,
        areaId: 4,
        activo: true,
      };
    },
  };

  const strategy = new JwtStrategy(configService, usuariosService);
  const usuario = await strategy.validate({
    id: 8,
    correo: 'anterior@demo.cl',
    rol: RolUsuario.TRABAJADOR,
    areaId: 2,
  });

  assert.deepEqual(usuario, {
    id: 8,
    correo: 'actualizado@demo.cl',
    rol: RolUsuario.ENCARGADO,
    areaId: 4,
  });
});

test('JwtStrategy.validate rechaza usuarios inexistentes o inactivos', async () => {
  const configService = {
    getOrThrow: () => 'jwt-secret-demo',
  };

  const strategy = new JwtStrategy(configService, {
    findAuthContextById: async () => ({
      id: 3,
      email: 'inactivo@demo.cl',
      rol: RolUsuario.TRABAJADOR,
      areaId: 1,
      activo: false,
    }),
  });

  await assert.rejects(
    strategy.validate({
      id: 3,
      correo: 'inactivo@demo.cl',
      rol: RolUsuario.TRABAJADOR,
      areaId: 1,
    }),
    (error) =>
      error instanceof UnauthorizedException &&
      /Sesion invalida o expirada/.test(error.message),
  );
});
