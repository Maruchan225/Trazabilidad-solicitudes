require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { UnauthorizedException } = require('@nestjs/common');
const { RolUsuario } = require('@prisma/client');
const { AuthService } = require('../dist/src/autenticacion/auth.service.js');

test('AuthService.iniciarSesion retorna token y usuario saneado', async () => {
  const usuario = {
    id: 3,
    email: 'trabajador@demo.cl',
    contrasena: 'hash-demo',
    activo: true,
    rol: RolUsuario.TRABAJADOR,
    areaId: 9,
    rut: '12345678-K',
    nombres: 'Ana',
    apellidos: 'Perez',
  };

  const usuariosService = {
    buscarPorCorreo: async (email) => {
      assert.equal(email, 'trabajador@demo.cl');
      return usuario;
    },
    validarContrasena: async (contrasenaPlano, contrasenaHash) => {
      assert.equal(contrasenaPlano, 'Demo1234!');
      assert.equal(contrasenaHash, 'hash-demo');
      return true;
    },
  };

  const jwtService = {
    signAsync: async (payload) => {
      assert.deepEqual(payload, {
        id: 3,
        correo: 'trabajador@demo.cl',
        rol: RolUsuario.TRABAJADOR,
        areaId: 9,
      });

      return 'token-demo';
    },
  };

  const service = new AuthService(usuariosService, jwtService);
  const resultado = await service.iniciarSesion({
    email: 'trabajador@demo.cl',
    contrasena: 'Demo1234!',
  });

  assert.deepEqual(resultado, {
    access_token: 'token-demo',
    usuario: {
      id: 3,
      correo: 'trabajador@demo.cl',
      rut: '12345678-K',
      rol: RolUsuario.TRABAJADOR,
      areaId: 9,
      nombres: 'Ana',
      apellidos: 'Perez',
    },
  });
});

test('AuthService.iniciarSesion rechaza usuarios ausentes o inactivos', async () => {
  const service = new AuthService(
    {
      buscarPorCorreo: async () => null,
      validarContrasena: async () => true,
    },
    {
      signAsync: async () => 'token-demo',
    },
  );

  await assert.rejects(
    service.iniciarSesion({
      email: 'nadie@demo.cl',
      contrasena: 'Demo1234!',
    }),
    (error) =>
      error instanceof UnauthorizedException &&
      /Credenciales invalidas/.test(error.message),
  );
});

test('AuthService.iniciarSesion rechaza contrasenas invalidas', async () => {
  const service = new AuthService(
    {
      buscarPorCorreo: async () => ({
        id: 5,
        email: 'encargado@demo.cl',
        contrasena: 'hash-demo',
        activo: true,
        rol: RolUsuario.ENCARGADO,
        areaId: 1,
        rut: '11111111-1',
        nombres: 'Juan',
        apellidos: 'Diaz',
      }),
      validarContrasena: async () => false,
    },
    {
      signAsync: async () => 'token-demo',
    },
  );

  await assert.rejects(
    service.iniciarSesion({
      email: 'encargado@demo.cl',
      contrasena: 'Incorrecta123!',
    }),
    (error) =>
      error instanceof UnauthorizedException &&
      /Credenciales invalidas/.test(error.message),
  );
});
