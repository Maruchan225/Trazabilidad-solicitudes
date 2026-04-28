import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { getCorsOrigins, getJwtSecret } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  getJwtSecret(configService);
  app.enableCors({
    origin: getCorsOrigins(configService),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalExceptionFilter(configService));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(configService.get<number>('PORT') ?? 3000);
}

bootstrap();
