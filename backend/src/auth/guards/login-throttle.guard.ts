import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

const windowMs = 15 * 60 * 1000;
const maxAttempts = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const email = typeof request.body?.email === 'string' ? request.body.email.toLowerCase().trim() : 'unknown';
    const key = `${request.ip}:${email}`;
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (current.count >= maxAttempts) {
      throw new HttpException('Too many login attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
    return true;
  }
}
