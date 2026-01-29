import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as os from 'os';

import { MetricsSnapshot } from './monitoring.types';

interface RequestMetric {
  timestamp: number;
  durationMs: number;
  isError: boolean;
  path: string;
}

/**
 * MetricsService - Collects operational metrics without external dependencies
 *
 * Features:
 * - In-memory metrics with sliding window (5 minutes)
 * - Request/error rate tracking
 * - Response time percentiles
 * - Queue status from Bull
 * - System resource usage
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics: RequestMetric[] = [];
  private readonly WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_METRICS = 10000;
  private startTime: number = Date.now();

  constructor(
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    this.startTime = Date.now();
    this.logger.log('Metrics collection initialized');
  }

  /**
   * Record a request metric
   */
  recordRequest(durationMs: number, isError: boolean, path: string): void {
    const metric: RequestMetric = {
      timestamp: Date.now(),
      durationMs,
      isError,
      path,
    };

    this.metrics.push(metric);

    // Prune old metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.pruneOldMetrics();
    }
  }

  /**
   * Get current metrics snapshot
   */
  async getSnapshot(): Promise<MetricsSnapshot> {
    this.pruneOldMetrics();

    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;
    const windowMetrics = this.metrics.filter((m) => m.timestamp >= windowStart);

    // Calculate request metrics
    const totalRequests = windowMetrics.length;
    const errorRequests = windowMetrics.filter((m) => m.isError).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const requestsPerMinute = totalRequests / 5; // 5 minute window

    // Calculate latency metrics
    const durations = windowMetrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const avgMs = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    const p50Ms = this.percentile(durations, 50);
    const p95Ms = this.percentile(durations, 95);
    const p99Ms = this.percentile(durations, 99);

    // Get queue metrics
    const queueMetrics = await this.getQueueMetrics();

    // Get system metrics
    const systemMetrics = this.getSystemMetrics();

    return {
      timestamp: new Date().toISOString(),
      window: '5m',
      requests: {
        total: totalRequests,
        perMinute: Math.round(requestsPerMinute * 100) / 100,
        errors: errorRequests,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      latency: {
        avgMs: Math.round(avgMs),
        p50Ms: Math.round(p50Ms),
        p95Ms: Math.round(p95Ms),
        p99Ms: Math.round(p99Ms),
      },
      queue: queueMetrics,
      system: systemMetrics,
    };
  }

  /**
   * Get error rate for threshold checking
   */
  getErrorRate(): number {
    this.pruneOldMetrics();
    const total = this.metrics.length;
    if (total === 0) {
      return 0;
    }
    const errors = this.metrics.filter((m) => m.isError).length;
    return (errors / total) * 100;
  }

  /**
   * Get average response time for threshold checking
   */
  getAvgResponseTime(): number {
    this.pruneOldMetrics();
    if (this.metrics.length === 0) {
      return 0;
    }
    const sum = this.metrics.reduce((a, m) => a + m.durationMs, 0);
    return sum / this.metrics.length;
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private async getQueueMetrics(): Promise<MetricsSnapshot['queue']> {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.analyticsQueue.getWaitingCount(),
        this.analyticsQueue.getActiveCount(),
        this.analyticsQueue.getCompletedCount(),
        this.analyticsQueue.getFailedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        lag: waiting + active,
      };
    } catch (error) {
      this.logger.warn('Failed to get queue metrics', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        lag: 0,
      };
    }
  }

  private getSystemMetrics(): MetricsSnapshot['system'] {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get CPU usage (simplified - average load)
    const cpus = os.cpus();
    const avgLoad = os.loadavg()[0];
    const cpuPercent = (avgLoad / cpus.length) * 100;

    return {
      memoryUsedMb: Math.round(usedMem / (1024 * 1024)),
      memoryTotalMb: Math.round(totalMem / (1024 * 1024)),
      cpuPercent: Math.round(cpuPercent * 100) / 100,
    };
  }

  private percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) {
      return 0;
    }
    const index = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, index)];
  }

  private pruneOldMetrics(): void {
    const cutoff = Date.now() - this.WINDOW_MS;
    while (this.metrics.length > 0 && this.metrics[0].timestamp < cutoff) {
      this.metrics.shift();
    }
  }
}
