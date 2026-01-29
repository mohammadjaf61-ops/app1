/**
 * Monitoring Types - PR#33
 * Operational thresholds and monitoring data structures
 */

export interface OperationalThresholds {
  /** Maximum acceptable error rate percentage (default: 2%) */
  maxErrorRatePercent: number;
  /** Maximum queue lag in jobs (default: 100) */
  maxQueueLag: number;
  /** Maximum average response time in ms (default: 2000) */
  maxResponseTimeMs: number;
  /** Maximum DB query time in ms (default: 1000) */
  maxDbLatencyMs: number;
  /** Maximum Redis response time in ms (default: 100) */
  maxRedisLatencyMs: number;
}

export const DEFAULT_THRESHOLDS: OperationalThresholds = {
  maxErrorRatePercent: 2,
  maxQueueLag: 100,
  maxResponseTimeMs: 2000,
  maxDbLatencyMs: 1000,
  maxRedisLatencyMs: 100,
};

export type SystemStatus = 'OK' | 'DEGRADED' | 'DOWN';

export interface ComponentHealth {
  name: string;
  status: SystemStatus;
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: SystemStatus;
  timestamp: string;
  uptime: number;
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    redis: ComponentHealth;
    workers: ComponentHealth;
  };
}

export interface MetricsSnapshot {
  timestamp: string;
  window: string;
  requests: {
    total: number;
    perMinute: number;
    errors: number;
    errorRate: number;
  };
  latency: {
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    lag: number;
  };
  system: {
    memoryUsedMb: number;
    memoryTotalMb: number;
    cpuPercent: number;
  };
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  component: string;
  metric: string;
  message: string;
  currentValue: number | string;
  threshold: number | string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AlertLog {
  alerts: Alert[];
  lastCheck: string;
  activeCount: number;
}
