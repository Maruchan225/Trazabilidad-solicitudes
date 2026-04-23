import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdjuntosModule } from './adjuntos/adjuntos.module';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './autenticacion/auth.module';
import { JwtAuthGuard } from './autenticacion/guardias/jwt-auth.guard';
import { RolesGuard } from './autenticacion/guardias/roles.guard';
import { HistorialSolicitudesModule } from './historial-solicitudes/historial-solicitudes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './reportes/reportes.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { TiposSolicitudModule } from './tipos-solicitud/tipos-solicitud.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string()
          .pattern(/^postgres(ql)?:\/\//)
          .required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN: Joi.string().default('8h'),
        AUTH_LOGIN_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),
        AUTH_LOGIN_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
        FRONTEND_URL: Joi.string().default('http://localhost:5173'),
        ADJUNTOS_DIR: Joi.string().optional(),
      }),
    }),
    AdjuntosModule,
    AuthModule,
    AreasModule,
    HistorialSolicitudesModule,
    PrismaModule,
    ReportesModule,
    SolicitudesModule,
    TiposSolicitudModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
