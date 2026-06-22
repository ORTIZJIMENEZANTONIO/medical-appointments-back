import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { PinoLogger } from 'nestjs-pino';

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
    let message: string | string[] = 'Error interno del servidor';
    let error = 'InternalServerError';

    if (exception instanceof DomainException) {
      status = exception.statusCode; // 409 / 422 / ...
      message = exception.message;
      error = exception.name;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus(); // incluye errores del ValidationPipe (400)
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : (((body as Record<string, unknown>).message as string) ??
            exception.message);
      error = exception.name;
    }
    // (error no controlado → se queda en 500 + mensaje genérico; NO se expone el detalle)

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      this.logger.warn(
        `${req.method} ${req.url} → ${status}: ${JSON.stringify(message)}`,
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
