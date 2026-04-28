import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export type AuthenticatedUser = { sub: string; email: string; role: UserRole };

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedUser => {
  return context.switchToHttp().getRequest().user;
});
