import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { RolUsuario } from '@prisma/client';
import { AppModule } from './../src/app.module';
import { AuthService } from './../src/autenticacion/auth.service';
import { PrismaService } from './../src/prisma/prisma.service';
import { SolicitudesService } from './../src/solicitudes/solicitudes.service';
import { UsuariosService } from './../src/usuarios/usuarios.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET,
  });

  const authServiceMock = {
    iniciarSesion: jest.fn(),
  };

  const usuariosServiceMock = {
    listar: jest.fn(),
    obtenerPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  };

  const solicitudesServiceMock = {
    crear: jest.fn(),
    listar: jest.fn(),
    verDetalle: jest.fn(),
    asignarSolicitud: jest.fn(),
    derivarSolicitudAArea: jest.fn(),
    cambiarEstadoSolicitud: jest.fn(),
    agregarObservacion: jest.fn(),
    finalizarSolicitud: jest.fn(),
    cerrarSolicitud: jest.fn(),
  };

  const crearToken = (rol: RolUsuario = RolUsuario.ENCARGADO) =>
    jwtService.sign({
      id: 1,
      correo: 'usuario@demo.cl',
      rol,
      areaId: 1,
    });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .overrideProvider(UsuariosService)
      .useValue(usuariosServiceMock)
      .overrideProvider(SolicitudesService)
      .useValue(solicitudesServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect(({ body }) => {
        const status = body as {
          name?: unknown;
          modulo?: unknown;
          status?: unknown;
          fechaHora?: unknown;
        };

        expect(status.name).toBe('backend-trazabilidad-municipal');
        expect(status.modulo).toBe('trazabilidad-municipal');
        expect(status.status).toBe('ok');
        expect(typeof status.fechaHora).toBe('string');
      });
  });

  it('POST /api/auth/login devuelve la sesion autenticada', async () => {
    authServiceMock.iniciarSesion.mockResolvedValue({
      access_token: 'token-prueba',
      usuario: {
        id: 1,
        correo: 'encargado@demo.cl',
        rol: RolUsuario.ENCARGADO,
        areaId: 1,
      },
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'encargado@demo.cl',
        contrasena: 'secreto123',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.access_token).toBe('token-prueba');
        expect(body.usuario.rol).toBe(RolUsuario.ENCARGADO);
      });

    expect(authServiceMock.iniciarSesion).toHaveBeenCalledWith({
      email: 'encargado@demo.cl',
      contrasena: 'secreto123',
    });
  });

  it('GET /api/usuarios lista usuarios para un encargado', async () => {
    usuariosServiceMock.listar.mockResolvedValue([
      { id: 1, nombres: 'Ana', apellidos: 'Perez' },
    ]);

    await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${crearToken(RolUsuario.ENCARGADO)}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].nombres).toBe('Ana');
      });

    expect(usuariosServiceMock.listar).toHaveBeenCalled();
  });

  it('GET /api/usuarios rechaza a un trabajador por permisos', async () => {
    await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${crearToken(RolUsuario.TRABAJADOR)}`)
      .expect(403);

    expect(usuariosServiceMock.listar).not.toHaveBeenCalled();
  });

  it('POST /api/solicitudes envia el usuario autenticado al servicio', async () => {
    solicitudesServiceMock.crear.mockResolvedValue({
      id: 99,
      titulo: 'Solicitud e2e',
    });

    const payload = {
      titulo: 'Solicitud e2e',
      descripcion: 'Descripcion de prueba para solicitud',
      prioridad: 'MEDIA',
      fechaVencimiento: '2026-04-20T18:00:00.000Z',
      areaActualId: 1,
      tipoSolicitudId: 1,
    };

    await request(app.getHttpServer())
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${crearToken(RolUsuario.ENCARGADO)}`)
      .send(payload)
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(99);
      });

    expect(solicitudesServiceMock.crear).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        id: 1,
        rol: RolUsuario.ENCARGADO,
      }),
    );
  });

  it('PATCH /api/solicitudes/:id/asignar delega al servicio', async () => {
    solicitudesServiceMock.asignarSolicitud.mockResolvedValue({
      id: 7,
      asignadoA: { id: 10 },
    });

    await request(app.getHttpServer())
      .patch('/api/solicitudes/7/asignar')
      .set('Authorization', `Bearer ${crearToken(RolUsuario.ENCARGADO)}`)
      .send({
        asignadoAId: 10,
        comentario: 'Asignacion de prueba',
      })
      .expect(200);

    expect(solicitudesServiceMock.asignarSolicitud).toHaveBeenCalledWith(
      7,
      {
        asignadoAId: 10,
        comentario: 'Asignacion de prueba',
      },
      expect.objectContaining({
        rol: RolUsuario.ENCARGADO,
      }),
    );
  });

  it('PATCH /api/solicitudes/:id/estado permite a trabajador cambiar estado', async () => {
    solicitudesServiceMock.cambiarEstadoSolicitud.mockResolvedValue({
      id: 7,
      estadoActual: 'EN_PROCESO',
    });

    await request(app.getHttpServer())
      .patch('/api/solicitudes/7/estado')
      .set('Authorization', `Bearer ${crearToken(RolUsuario.TRABAJADOR)}`)
      .send({
        estado: 'EN_PROCESO',
        comentario: 'Cambio de estado de prueba',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.estadoActual).toBe('EN_PROCESO');
      });

    expect(solicitudesServiceMock.cambiarEstadoSolicitud).toHaveBeenCalledWith(
      7,
      {
        estado: 'EN_PROCESO',
        comentario: 'Cambio de estado de prueba',
      },
      expect.objectContaining({
        rol: RolUsuario.TRABAJADOR,
      }),
    );
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
