import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * CacheService - Redis wrapper for read-through caching
 *
 * Design decisions:
 * - Uses ioredis (already installed for BullMQ)
 * - Graceful degradation: cache failures don't break the app
 * - Structured logging for cache hits/misses
 * - Type-safe get/set with JSON serialization
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    const password = this.configService.get<string>('redis.password');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, operating without cache');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis cache connected');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.warn(`Redis cache error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Redis cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis cache disconnected');
    }
  }

  /**
   * Get a value from cache
   * Returns null if key doesn't exist or cache is unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);

      if (value === null) {
        this.logger.debug(JSON.stringify({ event: 'cache_miss', key }));
        return null;
      }

      this.logger.debug(JSON.stringify({ event: 'cache_hit', key }));
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'cache_get_error',
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON serialized)
   * @param ttlSeconds Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client!.setex(key, ttlSeconds, serialized);

      this.logger.debug(JSON.stringify({ event: 'cache_set', key, ttl: ttlSeconds }));
      return true;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'cache_set_error',
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      return false;
    }
  }

  /**
   * Delete a specific key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.del(key);
      this.logger.debug(JSON.stringify({ event: 'cache_del', key }));
      return true;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'cache_del_error',
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * Use with caution - SCAN is used to avoid blocking
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      let deletedCount = 0;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.client!.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.client!.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      this.logger.debug(
        JSON.stringify({ event: 'cache_del_pattern', pattern, count: deletedCount }),
      );
      return deletedCount;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'cache_del_pattern_error',
          pattern,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      return 0;
    }
  }

  /**
   * Check if cache is available and connected
   */
  isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }
}
