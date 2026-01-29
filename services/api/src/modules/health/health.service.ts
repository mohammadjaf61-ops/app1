import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { CacheService } from '@/modules/cache';
import { PrismaService } from '@/prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    queue: ServiceStatus;
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  async check(): Promise<HealthStatus> {
    const [dbStatus, redisStatus, queueStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const isHealthy = dbStatus.status === 'up';
    const isDegraded = redisStatus.status === 'down' || queueStatus.status === 'degraded';

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (!isHealthy) {
      status = 'unhealthy';
    } else if (isDegraded) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: dbStatus,
        redis: redisStatus,
        queue: queueStatus,
      },
    };
  }

  async checkReadiness(): Promise<HealthStatus> {
    return this.check();
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return {
        status: latency > 1000 ? 'degraded' : 'up',
        latency,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();
    const isAvailable = this.cacheService.isAvailable();

    if (!isAvailable) {
      return {
        status: 'down',
        error: 'Redis not connected',
      };
    }

    try {
      await this.cacheService.get('__health_ping__');
      const latency = Date.now() - start;
      return {
        status: latency > 100 ? 'degraded' : 'up',
        latency,
      };
    } catch {
      return {
        status: 'down',
        latency: Date.now() - start,
        error: 'Redis ping failed',
      };
    }
  }

  private async checkQueue(): Promise<ServiceStatus> {
    try {
      const [waiting, active] = await Promise.all([
        this.analyticsQueue.getWaitingCount(),
        this.analyticsQueue.getActiveCount(),
      ]);
      const lag = waiting + active;

      return {
        status: lag > 100 ? 'degraded' : 'up',
        details: {
          waiting,
          active,
          lag,
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Queue check failed',
      };
    }
  }
}
