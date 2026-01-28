import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { StructuredLogger } from '../observability';
import '../types/express.d';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new StructuredLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const contentLength = response.get('content-length') || '0';
          const duration = Date.now() - startTime;

          this.logger.log('Request completed', {
            method,
            url,
            statusCode,
            contentLength: parseInt(contentLength, 10),
            durationMs: duration,
            ip,
            userAgent,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          this.logger.warn('Request failed', {
            method,
            url,
            durationMs: duration,
            ip,
            userAgent,
            error: error.message,
          });
        },
      }),
    );
  }
}
