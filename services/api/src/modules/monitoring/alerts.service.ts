import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CacheService } from '@/modules/cache';
import { PrismaService } from '@/prisma/prisma.service';

import {
  Alert,
  AlertLog,
  AlertSeverity,
  ComponentHealth,
  DEFAULT_THRESHOLDS,
  OperationalThresholds,
  SystemHealth,
  SystemStatus,
} from './monitoring.types';
import { MetricsService } from './metrics.service';

/**
 * AlertsService - Monitors thresholds and generates alerts
 *
 * Features:
 * - Periodic threshold checks (every 30 seconds)
 * - Alert deduplication (same alert not repeated within 5 minutes)
 * - Alert logging to file and memory
 * - Auto-resolution when conditions return to normal
 */
@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertsService.name);
  private readonly alerts: Alert[] = [];
  private readonly MAX_ALERTS = 100;
  private checkInterval: NodeJS.Timeout | null = null;
  private thresholds: OperationalThresholds = DEFAULT_THRESHOLDS;
  private readonly CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds
  private readonly DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly metricsService: MetricsService,
    private readonly cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Alerts monitoring initialized');
    this.startPeriodicCheck();
  }

  onModuleDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [dbHealth, redisHealth, queueHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const apiHealth: ComponentHealth = {
      name: 'API',
      status: this.calculateApiStatus(dbHealth, redisHealth),
    };

    const overall = this.calculateOverallStatus([apiHealth, dbHealth, redisHealth, queueHealth]);

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: this.metricsService.getUptime(),
      components: {
        api: apiHealth,
        database: dbHealth,
        redis: redisHealth,
        workers: queueHealth,
      },
    };
  }

  /**
   * Get current alerts
   */
  getAlerts(activeOnly = false): AlertLog {
    const filteredAlerts = activeOnly
      ? this.alerts.filter((a) => !a.resolved)
      : this.alerts;

    return {
      alerts: filteredAlerts.slice(-50), // Last 50 alerts
      lastCheck: new Date().toISOString(),
      activeCount: this.alerts.filter((a) => !a.resolved).length,
    };
  }

  /**
   * Update operational thresholds
   */
  setThresholds(thresholds: Partial<OperationalThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.logger.log('Thresholds updated', this.thresholds);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): OperationalThresholds {
    return { ...this.thresholds };
  }

  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(async () => {
      try {
        await this.runThresholdChecks();
      } catch (error) {
        this.logger.error('Threshold check failed', error);
      }
    }, this.CHECK_INTERVAL_MS);

    // Run initial check
    this.runThresholdChecks().catch((err) => {
      this.logger.error('Initial threshold check failed', err);
    });
  }

  private async runThresholdChecks(): Promise<void> {
    const metrics = await this.metricsService.getSnapshot();
    const health = await this.getSystemHealth();

    // Check error rate
    if (metrics.requests.errorRate > this.thresholds.maxErrorRatePercent) {
      this.createAlert(
        'CRITICAL',
        'API',
        'error_rate',
        `Error rate ${metrics.requests.errorRate}% exceeds threshold`,
        metrics.requests.errorRate,
        this.thresholds.maxErrorRatePercent,
      );
    } else {
      this.resolveAlerts('API', 'error_rate');
    }

    // Check response time
    if (metrics.latency.avgMs > this.thresholds.maxResponseTimeMs) {
      this.createAlert(
        'WARNING',
        'API',
        'response_time',
        `Average response time ${metrics.latency.avgMs}ms exceeds threshold`,
        metrics.latency.avgMs,
        this.thresholds.maxResponseTimeMs,
      );
    } else {
      this.resolveAlerts('API', 'response_time');
    }

    // Check queue lag
    if (metrics.queue.lag > this.thresholds.maxQueueLag) {
      this.createAlert(
        'WARNING',
        'Workers',
        'queue_lag',
        `Queue lag ${metrics.queue.lag} jobs exceeds threshold`,
        metrics.queue.lag,
        this.thresholds.maxQueueLag,
      );
    } else {
      this.resolveAlerts('Workers', 'queue_lag');
    }

    // Check database status
    if (health.components.database.status === 'DOWN') {
      this.createAlert(
        'CRITICAL',
        'Database',
        'connectivity',
        `Database is DOWN: ${health.components.database.error || 'Unknown error'}`,
        'DOWN',
        'UP',
      );
    } else if (health.components.database.status === 'DEGRADED') {
      this.createAlert(
        'WARNING',
        'Database',
        'latency',
        `Database latency ${health.components.database.latencyMs}ms is high`,
        health.components.database.latencyMs || 0,
        this.thresholds.maxDbLatencyMs,
      );
    } else {
      this.resolveAlerts('Database', 'connectivity');
      this.resolveAlerts('Database', 'latency');
    }

    // Check Redis status
    if (health.components.redis.status === 'DOWN') {
      this.createAlert(
        'WARNING',
        'Redis',
        'connectivity',
        'Redis cache is DOWN - operating without cache',
        'DOWN',
        'UP',
      );
    } else {
      this.resolveAlerts('Redis', 'connectivity');
    }
  }

  private createAlert(
    severity: AlertSeverity,
    component: string,
    metric: string,
    message: string,
    currentValue: number | string,
    threshold: number | string,
  ): void {
    // Check for duplicate (same component + metric within dedup window)
    const existingAlert = this.alerts.find(
      (a) =>
        a.component === component &&
        a.metric === metric &&
        !a.resolved &&
        Date.now() - new Date(a.timestamp).getTime() < this.DEDUP_WINDOW_MS,
    );

    if (existingAlert) {
      return;
    }

    const alert: Alert = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      severity,
      component,
      metric,
      message,
      currentValue,
      threshold,
      resolved: false,
    };

    this.alerts.push(alert);
    this.logAlert(alert);

    // Prune old alerts
    while (this.alerts.length > this.MAX_ALERTS) {
      this.alerts.shift();
    }
  }

  private resolveAlerts(component: string, metric: string): void {
    const activeAlerts = this.alerts.filter(
      (a) => a.component === component && a.metric === metric && !a.resolved,
    );

    for (const alert of activeAlerts) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.logger.log(`Alert resolved: [${alert.component}] ${alert.metric}`);
    }
  }

  private logAlert(alert: Alert): void {
    const logMessage = {
      event: 'alert_triggered',
      alertId: alert.id,
      severity: alert.severity,
      component: alert.component,
      metric: alert.metric,
      message: alert.message,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
    };

    if (alert.severity === 'CRITICAL') {
      this.logger.error(JSON.stringify(logMessage));
    } else if (alert.severity === 'WARNING') {
      this.logger.warn(JSON.stringify(logMessage));
    } else {
      this.logger.log(JSON.stringify(logMessage));
    }
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;

      let status: SystemStatus = 'OK';
      if (latencyMs > this.thresholds.maxDbLatencyMs) {
        status = 'DEGRADED';
      }

      return {
        name: 'Database',
        status,
        latencyMs,
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ComponentHealth> {
    const start = Date.now();
    const isAvailable = this.cacheService.isAvailable();

    if (!isAvailable) {
      return {
        name: 'Redis',
        status: 'DOWN',
        error: 'Redis not connected',
      };
    }

    try {
      // Simple ping test via get
      await this.cacheService.get('__health_check__');
      const latencyMs = Date.now() - start;

      let status: SystemStatus = 'OK';
      if (latencyMs > this.thresholds.maxRedisLatencyMs) {
        status = 'DEGRADED';
      }

      return {
        name: 'Redis',
        status,
        latencyMs,
      };
    } catch {
      return {
        name: 'Redis',
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: 'Redis health check failed',
      };
    }
  }

  private async checkQueue(): Promise<ComponentHealth> {
    try {
      const metrics = await this.metricsService.getSnapshot();
      const lag = metrics.queue.lag;

      let status: SystemStatus = 'OK';
      if (lag > this.thresholds.maxQueueLag) {
        status = 'DEGRADED';
      }

      return {
        name: 'Workers',
        status,
        details: {
          waiting: metrics.queue.waiting,
          active: metrics.queue.active,
          lag,
        },
      };
    } catch {
      return {
        name: 'Workers',
        status: 'DOWN',
        error: 'Unable to check queue status',
      };
    }
  }

  private calculateApiStatus(dbHealth: ComponentHealth, redisHealth: ComponentHealth): SystemStatus {
    if (dbHealth.status === 'DOWN') {
      return 'DOWN';
    }
    if (dbHealth.status === 'DEGRADED' || redisHealth.status === 'DOWN') {
      return 'DEGRADED';
    }
    return 'OK';
  }

  private calculateOverallStatus(components: ComponentHealth[]): SystemStatus {
    if (components.some((c) => c.status === 'DOWN')) {
      return 'DOWN';
    }
    if (components.some((c) => c.status === 'DEGRADED')) {
      return 'DEGRADED';
    }
    return 'OK';
  }
}
