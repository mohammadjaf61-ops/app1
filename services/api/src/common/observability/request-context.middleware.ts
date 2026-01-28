import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { RequestContext, RequestContextData } from './request-context';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * RequestContext Middleware
 *
 * Sets up AsyncLocalStorage context for each request.
 * Must be applied before any other middleware/interceptors.
 *
 * Features:
 * - Extracts or generates request ID from headers
 * - Supports both x-request-id and x-correlation-id headers
 * - Attaches ID to response headers for client correlation
 * - Sets up AsyncLocalStorage for deep propagation
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Get request ID from headers (support both naming conventions)
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string) ||
      (req.headers[CORRELATION_ID_HEADER] as string) ||
      uuidv4();

    // Attach to request object for interceptors/guards
    req.correlationId = requestId;

    // Set response headers
    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.setHeader(CORRELATION_ID_HEADER, requestId);

    // Create context data
    const contextData: RequestContextData = {
      requestId,
      startTime: Date.now(),
      method: req.method,
      path: req.path,
    };

    // Run the rest of the request within this context
    RequestContext.run(contextData, () => {
      next();
    });
  }
}
