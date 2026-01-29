import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

import { MetricsService } from './metrics.service';

/**
 * MetricsInterceptor - Captures request metrics for monitoring
 *
 * Records:
 * - Request duration
 * - Error status
 * - Request path
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.route?.path || request.path || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.metricsService.recordRequest(duration, false, path);
        },
        error: () => {
          const duration = Date.now() - start;
          this.metricsService.recordRequest(duration, true, path);
        },
      }),
    );
  }
}
