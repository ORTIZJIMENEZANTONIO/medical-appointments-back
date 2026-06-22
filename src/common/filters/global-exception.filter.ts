import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { ERRORS } from '@/common/constants/messages';
import { PinoLogger } from 'nestjs-pino';

// Frases estándar para el campo `error`. Evita exponer nombres de clases internas
// (p. ej. "AppointmentOverlapException") en la respuesta → contrato limpio + sin fuga.
const REASON_PHRASES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = ERRORS.INTERNAL;

    if (exception instanceof DomainException) {
      // Excepción de negocio → su statusCode (ej. 409) + su mensaje seguro.
      status = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      // Cubre NotFound/Conflict/BadRequest del ValidationPipe, Throttler (429), etc.
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as Record<string, unknown>).message as string | string[]) ??
            exception.message;
    }
    // Cualquier otra cosa → 500 con mensaje genérico; el detalle NUNCA se expone.

    const error =
      REASON_PHRASES[status] ?? REASON_PHRASES[HttpStatus.INTERNAL_SERVER_ERROR];

    // Solo los 5xx se loguean como error (con stack). Los 4xx ya los registra
    // pino-http a nivel de request, no hace falta duplicar.
    if (status >= 500) {
      this.logger.error(
        { err: exception, method: req.method, url: req.url, status },
        'Unhandled exception',
      );
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
