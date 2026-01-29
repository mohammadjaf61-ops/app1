import { AsyncLocalStorage } from 'async_hooks';

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request context data stored in AsyncLocalStorage
 */
export interface RequestContextData {
  requestId: string;
  startTime: number;
  userId?: string;
  userRole?: string;
  method?: string;
  path?: string;
}

/**
 * AsyncLocalStorage instance for request context
 * Allows accessing request context from anywhere in the call stack
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContextData>();

/**
 * RequestContext Service
 *
 * Provides access to request-scoped context data from anywhere in the application.
 * Uses AsyncLocalStorage for zero-overhead context propagation.
 *
 * Usage:
 * - Middleware sets context at request start
 * - Services/repositories access via RequestContext.getRequestId()
 * - Jobs can set their own context via RequestContext.run()
 */
@Injectable()
export class RequestContext {
  /**
   * Run a function within a request context
   */
  static run<T>(context: RequestContextData, fn: () => T): T {
    return asyncLocalStorage.run(context, fn);
  }

  /**
   * Run an async function within a request context
   */
  static runAsync<T>(context: RequestContextData, fn: () => Promise<T>): Promise<T> {
    return asyncLocalStorage.run(context, fn);
  }

  /**
   * Get the current request context
   */
  static get(): RequestContextData | undefined {
    return asyncLocalStorage.getStore();
  }

  /**
   * Get the current request ID (or generate a fallback)
   */
  static getRequestId(): string {
    return asyncLocalStorage.getStore()?.requestId ?? `orphan-${uuidv4().slice(0, 8)}`;
  }

  /**
   * Get the current user ID
   */
  static getUserId(): string | undefined {
    return asyncLocalStorage.getStore()?.userId;
  }

  /**
   * Get the elapsed time since request start
   */
  static getElapsedMs(): number {
    const store = asyncLocalStorage.getStore();
    if (!store?.startTime) {
      return 0;
    }
    return Date.now() - store.startTime;
  }

  /**
   * Create a new context data object
   */
  static createContext(overrides?: Partial<RequestContextData>): RequestContextData {
    return {
      requestId: uuidv4(),
      startTime: Date.now(),
      ...overrides,
    };
  }

  /**
   * Create context for background jobs
   */
  static createJobContext(jobName: string, jobId?: string): RequestContextData {
    return {
      requestId: `job-${jobName}-${jobId ?? uuidv4().slice(0, 8)}`,
      startTime: Date.now(),
      path: `job:${jobName}`,
    };
  }
}
