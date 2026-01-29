import { Throttle, SkipThrottle } from '@nestjs/throttler';

/**
 * Rate limiting decorators for different endpoint types
 * Security: PR#20
 */

/**
 * Strict rate limit for auth endpoints (login, OTP)
 * 5 requests per minute - prevents brute force attacks
 */
export const ThrottleAuth = () =>
  Throttle({
    default: {
      ttl: 60000, // 1 minute
      limit: 5, // 5 attempts per minute
    },
  });

/**
 * Rate limit for OTP send endpoint
 * 3 requests per 5 minutes - prevents SMS bombing
 */
export const ThrottleOtp = () =>
  Throttle({
    default: {
      ttl: 300000, // 5 minutes
      limit: 3, // 3 OTP requests per 5 minutes
    },
  });

/**
 * Rate limit for order creation
 * 30 requests per minute - allows normal usage, prevents abuse
 */
export const ThrottleOrderCreate = () =>
  Throttle({
    default: {
      ttl: 60000, // 1 minute
      limit: 30, // 30 orders per minute
    },
  });

/**
 * Rate limit for POS operations
 * 60 requests per minute - allows fast cashier operations
 */
export const ThrottlePOS = () =>
  Throttle({
    default: {
      ttl: 60000, // 1 minute
      limit: 60, // 60 requests per minute
    },
  });

/**
 * Skip throttling for health checks and internal endpoints
 */
export const NoThrottle = () => SkipThrottle();
