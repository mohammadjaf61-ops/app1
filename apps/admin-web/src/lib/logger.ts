export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  scope: string;
  errorCode?: string;
  requestId?: string;
  userId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: { name: string; message: string; digest?: string; stack?: string };
}

interface LoggerConfig {
  scope: string;
  enabled?: boolean;
}

const isDev = process.env.NODE_ENV === 'development';

export function createLogger(config: LoggerConfig) {
  const { scope, enabled = true } = config;

  const formatEntry = (
    level: LogLevel,
    message: string,
    error?: Error & { digest?: string },
    ctx?: Partial<LogContext>,
  ): LogEntry => ({
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        digest: error.digest,
        stack: isDev ? error.stack : undefined,
      },
    }),
  });

  const log = (
    level: LogLevel,
    message: string,
    errorOrCtx?: Error | Partial<LogContext>,
    ctx?: Partial<LogContext>,
  ) => {
    if (!enabled) {
      return;
    }
    if (!isDev && (level === 'debug' || level === 'info')) {
      return;
    }

    const isError = errorOrCtx instanceof Error;
    const entry = formatEntry(
      level,
      message,
      isError ? errorOrCtx : undefined,
      isError ? ctx : errorOrCtx,
    );
    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(output);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(output);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(output);
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(output);
        break;
    }
  };

  return {
    debug: (msg: string, ctx?: Partial<LogContext>) => log('debug', msg, ctx),
    info: (msg: string, ctx?: Partial<LogContext>) => log('info', msg, ctx),
    warn: (msg: string, errOrCtx?: Error | Partial<LogContext>, ctx?: Partial<LogContext>) =>
      log('warn', msg, errOrCtx, ctx),
    error: (msg: string, errOrCtx?: Error | Partial<LogContext>, ctx?: Partial<LogContext>) =>
      log('error', msg, errOrCtx, ctx),
  };
}

export const appLogger = createLogger({ scope: 'App' });
export const apiLogger = createLogger({ scope: 'API' });
export const authLogger = createLogger({ scope: 'Auth' });
