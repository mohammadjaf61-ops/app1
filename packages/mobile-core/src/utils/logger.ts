/**
 * Structured Logger for Hypermarket Platform
 *
 * Provides consistent, structured logging across all apps.
 * Currently outputs to console in structured JSON format.
 * Designed to be easily extended for APM integration (Sentry, etc.) later.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  scope: string;
  errorCode?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerOptions {
  scope: string;
  enabled?: boolean;
}

/**
 * Creates a scoped logger instance.
 *
 * Usage:
 * ```ts
 * const logger = createLogger({ scope: 'AuthService' });
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Login failed', new Error('Invalid token'), { errorCode: 'AUTH_001' });
 * ```
 */
export function createLogger(options: LoggerOptions) {
  const { scope, enabled = true } = options;

  const formatEntry = (
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Partial<LogContext>,
  ): LogEntry => {
    const entry: LogEntry = {
      level,
      scope,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: __DEV__ ? error.stack : undefined,
      };
    }

    return entry;
  };

  const log = (
    level: LogLevel,
    message: string,
    errorOrContext?: Error | Partial<LogContext>,
    context?: Partial<LogContext>,
  ) => {
    if (!enabled) {
      return;
    }

    let error: Error | undefined;
    let logContext: Partial<LogContext> | undefined;

    if (errorOrContext instanceof Error) {
      error = errorOrContext;
      logContext = context;
    } else {
      logContext = errorOrContext;
    }

    const entry = formatEntry(level, message, error, logContext);

    // In production, we only log warn and error levels
    // In development, we log everything
    if (!__DEV__ && (level === 'debug' || level === 'info')) {
      return;
    }

    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  };

  return {
    debug: (message: string, context?: Partial<LogContext>) => log('debug', message, context),

    info: (message: string, context?: Partial<LogContext>) => log('info', message, context),

    warn: (
      message: string,
      errorOrContext?: Error | Partial<LogContext>,
      context?: Partial<LogContext>,
    ) => log('warn', message, errorOrContext, context),

    error: (
      message: string,
      errorOrContext?: Error | Partial<LogContext>,
      context?: Partial<LogContext>,
    ) => log('error', message, errorOrContext, context),
  };
}

// Default app-level loggers
export const appLogger = createLogger({ scope: 'App' });
export const apiLogger = createLogger({ scope: 'API' });
export const authLogger = createLogger({ scope: 'Auth' });
export const navigationLogger = createLogger({ scope: 'Navigation' });
