import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

type RequestConLogin = Request & {
  body?: {
    email?: unknown;
  };
};

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly intentosPorLlave = new Map<string, number[]>();
  private readonly maxIntentos: number;
  private readonly ventanaMs: number;

  constructor(private readonly configService: ConfigService) {
    this.maxIntentos = this.configService.get<number>(
      'AUTH_LOGIN_MAX_ATTEMPTS',
      5,
    );
    this.ventanaMs = this.configService.get<number>('AUTH_LOGIN_WINDOW_MS', 60_000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestConLogin>();
    const ahora = Date.now();
    const llave = this.construirLlave(request);
    const intentosRecientes = (
      this.intentosPorLlave.get(llave) ?? []
    ).filter((timestamp) => ahora - timestamp < this.ventanaMs);

    if (intentosRecientes.length >= this.maxIntentos) {
      this.intentosPorLlave.set(llave, intentosRecientes);
      throw new HttpException(
        'Demasiados intentos de inicio de sesion. Intente nuevamente en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    intentosRecientes.push(ahora);
    this.intentosPorLlave.set(llave, intentosRecientes);
    this.limpiarRegistrosExpirados(ahora);

    return true;
  }

  private construirLlave(request: RequestConLogin) {
    const email =
      typeof request.body?.email === 'string'
        ? request.body.email.trim().toLowerCase()
        : 'sin-correo';
    const forwardedFor = request.headers['x-forwarded-for'];
    const ipHeader = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0];
    const ip =
      ipHeader?.trim() ||
      request.ip ||
      request.socket?.remoteAddress ||
      'desconocido';

    return `${ip}|${email}`;
  }

  private limpiarRegistrosExpirados(ahora: number) {
    for (const [llave, timestamps] of this.intentosPorLlave.entries()) {
      const vigentes = timestamps.filter(
        (timestamp) => ahora - timestamp < this.ventanaMs,
      );

      if (vigentes.length === 0) {
        this.intentosPorLlave.delete(llave);
        continue;
      }

      this.intentosPorLlave.set(llave, vigentes);
    }
  }
}
