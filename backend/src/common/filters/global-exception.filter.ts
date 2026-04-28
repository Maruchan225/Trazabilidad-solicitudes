import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { isProduction } from '../../config/environment';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const message = this.getClientMessage(exception, exceptionResponse, status);
    const logContext = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      statusCode: status,
      message,
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logContext), exception instanceof Error ? exception.stack : String(exception));
    } else {
      this.logger.warn(JSON.stringify(logContext));
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(isProduction(this.configService) || !(exception instanceof Error) ? {} : { error: exception.name }),
    });
  }

  private getClientMessage(exception: unknown, exceptionResponse: unknown, status: number) {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const message = (exceptionResponse as { message: unknown }).message;
      return Array.isArray(message) ? message.join(', ') : String(message);
    }
    if (status >= 500) return 'Error interno del servidor';
    return exception instanceof Error ? exception.message : 'Error inesperado';
  }
}
