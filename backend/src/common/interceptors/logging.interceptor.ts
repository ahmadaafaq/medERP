import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const tenantId = (request as any).tenant?.id || '-';
    const userId = (request as any).user?.id || '-';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = response.statusCode;
          this.logger.log(
            `${method} ${url} → ${status} [${ms}ms] tenant=${tenantId} user=${userId}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = err?.status || 500;
          this.logger.error(
            `${method} ${url} → ${status} [${ms}ms] tenant=${tenantId} user=${userId}`,
          );
        },
      }),
    );
  }
}
