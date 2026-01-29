'use client';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface ComponentHealth {
  name: string;
  status: 'OK' | 'DEGRADED' | 'DOWN';
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface SystemHealth {
  overall: 'OK' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  uptime: number;
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    redis: ComponentHealth;
    workers: ComponentHealth;
  };
}

interface MetricsSnapshot {
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

interface Alert {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  component: string;
  metric: string;
  message: string;
  resolved: boolean;
}

const StatusIcon = ({
  status,
}: {
  status: 'OK' | 'DEGRADED' | 'DOWN' | 'up' | 'down' | 'degraded';
}) => {
  const normalizedStatus = status.toUpperCase() as 'OK' | 'DEGRADED' | 'DOWN' | 'UP';
  if (normalizedStatus === 'OK' || normalizedStatus === 'UP') {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  if (normalizedStatus === 'DEGRADED') {
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-500" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === 'OK' || normalizedStatus === 'UP' || normalizedStatus === 'HEALTHY') {
    return <Badge className="bg-green-500">سليم</Badge>;
  }
  if (normalizedStatus === 'DEGRADED') {
    return <Badge className="bg-yellow-500">متدهور</Badge>;
  }
  return <Badge className="bg-red-500">معطل</Badge>;
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} يوم ${hours} ساعة`;
  }
  if (hours > 0) {
    return `${hours} ساعة ${minutes} دقيقة`;
  }
  return `${minutes} دقيقة`;
};

export default function StatusPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const [healthRes, metricsRes, alertsRes] = await Promise.all([
        fetch(`${apiUrl}/monitoring/status`),
        fetch(`${apiUrl}/monitoring/metrics`),
        fetch(`${apiUrl}/monitoring/alerts?active=true`).catch(() => null),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (alertsRes?.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const memoryPercent = metrics
    ? Math.round((metrics.system.memoryUsedMb / metrics.system.memoryTotalMb) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">حالة النظام</h1>
          <p className="text-muted-foreground">مراقبة صحة وأداء المنصة</p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              آخر تحديث: {lastRefresh.toLocaleTimeString('ar-IQ')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6" />
              <div>
                <CardTitle>الحالة العامة</CardTitle>
                <CardDescription>نظرة عامة على صحة النظام</CardDescription>
              </div>
            </div>
            {health && <StatusBadge status={health.overall} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* API */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">API</p>
                <p className="text-xs text-muted-foreground">
                  {health?.components.api.status === 'OK' ? 'يعمل بشكل طبيعي' : 'يوجد مشكلة'}
                </p>
              </div>
              {health && <StatusIcon status={health.components.api.status} />}
            </div>

            {/* Database */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">قاعدة البيانات</p>
                <p className="text-xs text-muted-foreground">
                  {health?.components.database.latencyMs
                    ? `${health.components.database.latencyMs}ms`
                    : '-'}
                </p>
              </div>
              {health && <StatusIcon status={health.components.database.status} />}
            </div>

            {/* Redis */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Redis (Cache)</p>
                <p className="text-xs text-muted-foreground">
                  {health?.components.redis.latencyMs
                    ? `${health.components.redis.latencyMs}ms`
                    : health?.components.redis.error || '-'}
                </p>
              </div>
              {health && <StatusIcon status={health.components.redis.status} />}
            </div>

            {/* Workers */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Workers</p>
                <p className="text-xs text-muted-foreground">
                  {metrics ? `${metrics.queue.lag} في الانتظار` : '-'}
                </p>
              </div>
              {health && <StatusIcon status={health.components.workers.status} />}
            </div>
          </div>

          {health && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>وقت التشغيل: {formatUptime(health.uptime)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الطلبات / دقيقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.requests.perMinute || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.requests.total || 0} إجمالي (5 دقائق)
            </p>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">معدل الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={metrics && metrics.requests.errorRate > 2 ? 'text-red-500' : ''}>
                {metrics?.requests.errorRate || 0}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{metrics?.requests.errors || 0} خطأ</p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">زمن الاستجابة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.latency.avgMs || 0}ms</div>
            <p className="text-xs text-muted-foreground">P95: {metrics?.latency.p95Ms || 0}ms</p>
          </CardContent>
        </Card>

        {/* Queue Lag */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تأخر القائمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={metrics && metrics.queue.lag > 100 ? 'text-yellow-500' : ''}>
                {metrics?.queue.lag || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.queue.waiting || 0} انتظار، {metrics?.queue.active || 0} نشط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle>موارد النظام</CardTitle>
          <CardDescription>استخدام الذاكرة والمعالج</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>الذاكرة</span>
              <span>
                {metrics?.system.memoryUsedMb || 0} MB / {metrics?.system.memoryTotalMb || 0} MB (
                {memoryPercent}%)
              </span>
            </div>
            <Progress value={memoryPercent} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>المعالج (Load Avg)</span>
              <span>{metrics?.system.cpuPercent || 0}%</span>
            </div>
            <Progress value={Math.min(metrics?.system.cpuPercent || 0, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            التنبيهات النشطة
          </CardTitle>
          <CardDescription>التنبيهات التي تحتاج إلى انتباه</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>لا توجد تنبيهات نشطة</span>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {alert.severity === 'CRITICAL' ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.component}</span>
                      <Badge variant="outline" className="text-xs">
                        {alert.metric}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString('ar-IQ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Thresholds Info */}
      <Card>
        <CardHeader>
          <CardTitle>الحدود التشغيلية</CardTitle>
          <CardDescription>القيم التي تُنشئ تنبيهات عند تجاوزها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">معدل الأخطاء</p>
              <p className="text-2xl font-bold">&gt; 2%</p>
              <p className="text-xs text-muted-foreground">CRITICAL</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">تأخر القائمة</p>
              <p className="text-2xl font-bold">&gt; 100</p>
              <p className="text-xs text-muted-foreground">WARNING</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">زمن الاستجابة</p>
              <p className="text-2xl font-bold">&gt; 2000ms</p>
              <p className="text-xs text-muted-foreground">WARNING</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">تأخر DB</p>
              <p className="text-2xl font-bold">&gt; 1000ms</p>
              <p className="text-xs text-muted-foreground">DEGRADED</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
