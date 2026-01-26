import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Get existing correlation ID or generate new one
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

    // Attach to request for use in services/logging
    request['correlationId'] = correlationId;

    // Add to response headers
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle();
  }
}
