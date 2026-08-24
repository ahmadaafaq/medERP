import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        errors = Array.isArray(resp.message) ? resp.message : null;
        if (errors) message = 'Validation failed';
      }
    } else if (exception instanceof Error) {
      console.error('Unhandled Exception in request:', exception);
      this.logger.error(`Unhandled exception: ${exception.message}`, {
        stack: exception.stack,
        path: request.url,
        method: request.method,
        tenantId: (request as any).tenant?.id,
        userId: (request as any).user?.id,
      });
      if (process.env.NODE_ENV === 'development') {
        message = `${exception.name}: ${exception.message}`;
      }
    }

    // Log all errors >= 500
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`, {
        message,
        tenantId: (request as any).tenant?.id,
        userId: (request as any).user?.id,
        ip: request.ip,
      });
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
