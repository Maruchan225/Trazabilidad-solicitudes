require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const { RolUsuario } = require('@prisma/client');
const { UsuariosService } = require('../dist/src/usuarios/usuarios.service.js');

test('UsuariosService.crear normaliza el rut antes de persistir', async () => {
  let createArgs;

  const prisma = {
    area: {
      findUnique: async () => ({ id: 1, nombre: 'Secretaria' }),
    },
    usuario: {
      create: async (args) => {
        createArgs = args;

        return {
          id: 10,
          nombres: 'Ana',
          apellidos: 'Perez',
          rut: args.data.rut,
          email: 'ana@demo.cl',
          telefono: null,
          rol: RolUsuario.TRABAJADOR,
          activo: true,
          areaId: 1,
          area: { id: 1, nombre: 'Secretaria' },
          creadoEn: new Date(),
          actualizadoEn: new Date(),
          _count: {
            solicitudesAsignadas: 0,
          },
        };
      },
    },
  };

  const service = new UsuariosService(prisma);

  await service.crear({
    nombres: 'Ana',
    apellidos: 'Perez',
    rut: '12.345.678-k',
    email: 'ana@demo.cl',
    contrasena: 'Demo1234!',
    rol: RolUsuario.TRABAJADOR,
    areaId: 1,
    activo: true,
  });

  assert.equal(createArgs.data.rut, '12345678-K');
  assert.notEqual(createArgs.data.contrasena, 'Demo1234!');
});

test('UsuariosService.listar incluye busqueda por rut normalizado', async () => {
  let findManyArgs;

  const prisma = {
    usuario: {
      findMany: async (args) => {
        findManyArgs = args;
        return [];
      },
    },
  };

  const service = new UsuariosService(prisma);

  await service.listar({ busqueda: '12.345.678-k' });

  const filtroRut = findManyArgs.where.OR.find((item) => item.rut);

  assert.deepEqual(filtroRut, {
    rut: {
      contains: '12345678-K',
      mode: 'insensitive',
    },
  });
});

test('UsuariosService.listar aplica paginacion opcional', async () => {
  let findManyArgs;

  const prisma = {
    usuario: {
      findMany: async (args) => {
        findManyArgs = args;
        return [];
      },
    },
  };

  const service = new UsuariosService(prisma);

  await service.listar({ limite: 20, offset: 40, rol: RolUsuario.TRABAJADOR });

  assert.equal(findManyArgs.take, 20);
  assert.equal(findManyArgs.skip, 40);
  assert.equal(findManyArgs.where.rol, RolUsuario.TRABAJADOR);
});

test('UsuariosService.eliminar retorna usuario saneado', async () => {
  let deleteArgs;

  const prisma = {
    usuario: {
      findUnique: async () => ({
        id: 10,
        nombres: 'Ana',
        apellidos: 'Perez',
        email: 'ana@demo.cl',
        areaId: 1,
        activo: true,
        area: { id: 1, nombre: 'Secretaria' },
        _count: {
          solicitudesAsignadas: 2,
        },
      }),
      delete: async (args) => {
        deleteArgs = args;

        return {
          id: 10,
          nombres: 'Ana',
          apellidos: 'Perez',
          email: 'ana@demo.cl',
          areaId: 1,
          activo: true,
          area: { id: 1, nombre: 'Secretaria' },
          _count: {
            solicitudesAsignadas: 2,
          },
        };
      },
    },
  };

  const service = new UsuariosService(prisma);
  const resultado = await service.eliminar(10);

  assert.equal(deleteArgs.omit.contrasena, true);
  assert.equal(deleteArgs.include.area, true);
  assert.equal(deleteArgs.include._count.select.solicitudesAsignadas, true);
  assert.equal(resultado.totalSolicitudes, 2);
  assert.equal('contrasena' in resultado, false);
});
