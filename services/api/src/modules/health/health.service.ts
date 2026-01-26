import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceStatus;
    redis?: ServiceStatus;
    meilisearch?: ServiceStatus;
  };
}

interface ServiceStatus {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const dbStatus = await this.checkDatabase();

    const isHealthy = dbStatus.status === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.1',
      services: {
        database: dbStatus,
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
      return {
        status: 'up',
        latency: Date.now() - start,
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
}
