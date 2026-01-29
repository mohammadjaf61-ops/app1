import { Injectable, LoggerService, LogLevel, Scope } from '@nestjs/common';

import { RequestContext } from './request-context';

/**
 * Log entry structure for JSON output
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  requestId: string;
  message: string;
  context?: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

/**
 * Log levels in order of severity
 */
const LOG_LEVELS: Record<string, number> = {
  error: 0,
  warn: 1,
  log: 2,
  debug: 3,
  verbose: 4,
};

/**
 * StructuredLogger
 *
 * Production-ready JSON logger with automatic request context.
 * Replaces console.log with structured, queryable logs.
 *
 * Features:
 * - JSON output for log aggregation (ELK, CloudWatch, etc.)
 * - Automatic requestId inclusion from RequestContext
 * - Duration tracking
 * - Sensitive data filtering
 * - Consistent log levels
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   private readonly logger = new StructuredLogger(MyService.name);
 *
 *   async doSomething() {
 *     this.logger.log('Starting operation', { orderId: '123' });
 *     this.logger.warn('Potential issue', { reason: 'low stock' });
 *     this.logger.error('Operation failed', { error: err.message });
 *   }
 * }
 * ```
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger implements LoggerService {
  private static serviceName = 'hypermarket-api';
  private static minLevel: number = LOG_LEVELS.debug;

  private context: string;

  constructor(context?: string) {
    this.context = context || 'Application';
  }

  /**
   * Set the minimum log level globally
   */
  static setMinLevel(level: LogLevel): void {
    StructuredLogger.minLevel = LOG_LEVELS[level] ?? LOG_LEVELS.debug;
  }

  /**
   * Set the service name for all logs
   */
  static setServiceName(name: string): void {
    StructuredLogger.serviceName = name;
  }

  /**
   * Log at info level
   */
  log(message: string, meta?: Record<string, unknown> | string): void {
    this.writeLog('log', message, meta);
  }

  /**
   * Log at error level
   */
  error(message: string, trace?: string, meta?: Record<string, unknown>): void {
    const metadata = meta || {};
    if (trace) {
      metadata.stack = trace;
    }
    this.writeLog('error', message, metadata);
  }

  /**
   * Log at warn level
   */
  warn(message: string, meta?: Record<string, unknown> | string): void {
    this.writeLog('warn', message, meta);
  }

  /**
   * Log at debug level
   */
  debug(message: string, meta?: Record<string, unknown> | string): void {
    this.writeLog('debug', message, meta);
  }

  /**
   * Log at verbose level
   */
  verbose(message: string, meta?: Record<string, unknown> | string): void {
    this.writeLog('verbose', message, meta);
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): StructuredLogger {
    return new StructuredLogger(`${this.context}:${context}`);
  }

  /**
   * Write log entry to stdout
   */
  private writeLog(
    level: string,
    message: string,
    metaOrContext?: Record<string, unknown> | string,
  ): void {
    // Check log level
    if (LOG_LEVELS[level] > StructuredLogger.minLevel) {
      return;
    }

    // Handle context string as second argument (NestJS pattern)
    let meta: Record<string, unknown> | undefined;
    let context = this.context;

    if (typeof metaOrContext === 'string') {
      context = metaOrContext;
    } else if (metaOrContext) {
      meta = this.sanitizeMeta(metaOrContext);
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: StructuredLogger.serviceName,
      requestId: RequestContext.getRequestId(),
      message,
      context,
    };

    // Add duration if in request context
    const elapsed = RequestContext.getElapsedMs();
    if (elapsed > 0) {
      entry.durationMs = elapsed;
    }

    // Add metadata if present
    if (meta && Object.keys(meta).length > 0) {
      entry.meta = meta;
    }

    // Output to appropriate stream
    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(`${output}\n`);
    } else {
      process.stdout.write(`${output}\n`);
    }
  }

  /**
   * Remove sensitive fields from metadata
   */
  private sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'cookie',
      'creditCard',
      'cvv',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(meta)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMeta(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}
