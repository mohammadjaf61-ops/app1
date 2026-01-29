import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';

/**
 * Custom throttler guard that handles requests behind proxies
 * Uses X-Forwarded-For header for client IP identification
 * Security: PR#20
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Get real IP from X-Forwarded-For header (set by nginx/load balancer)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can be comma-separated list, take first (client IP)
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    // Fallback to direct IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  protected getRequestResponse(context: ExecutionContext): { req: Request; res: Response } {
    const http = context.switchToHttp();
    return { req: http.getRequest<Request>(), res: http.getResponse<Response>() };
  }
}
