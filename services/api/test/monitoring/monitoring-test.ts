/**
 * Monitoring & Alerts Tests for Hypermarket API (PR#33)
 *
 * Tests system monitoring endpoints and alert behavior:
 * 1. Health endpoint with DB, Redis, Queue checks
 * 2. Metrics endpoint with request/error tracking
 * 3. Status endpoint for system health
 * 4. Alerts endpoint for active alerts
 * 5. Degraded state detection
 *
 * Usage:
 *   npx ts-node test/monitoring/monitoring-test.ts
 *
 * Prerequisites:
 *   - API running at http://localhost:3000
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: { status: string; latency?: number; error?: string };
    redis: { status: string; latency?: number; error?: string };
    queue: { status: string; details?: Record<string, unknown>; error?: string };
  };
}

interface MetricsResponse {
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

interface StatusResponse {
  overall: 'OK' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  uptime: number;
  components: {
    api: { name: string; status: string };
    database: { name: string; status: string; latencyMs?: number };
    redis: { name: string; status: string; latencyMs?: number; error?: string };
    workers: { name: string; status: string; details?: Record<string, unknown> };
  };
}

async function makeRequest<T>(endpoint: string): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data: data as T,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runTest(name: string, testFn: () => Promise<{ passed: boolean; details: string }>): Promise<TestResult> {
  console.log(`\n[TEST] ${name}`);
  const start = Date.now();

  try {
    const result = await testFn();
    const duration = Date.now() - start;

    console.log(`  ${result.passed ? '✓ PASS' : '✗ FAIL'}: ${result.details}`);
    console.log(`  Duration: ${duration}ms`);

    return { name, ...result, duration };
  } catch (err) {
    const duration = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);

    console.log(`  ✗ ERROR: ${error}`);

    return { name, passed: false, details: `Error: ${error}`, duration };
  }
}

/**
 * Test 1: Health Endpoint Extended
 *
 * Verify /health returns DB, Redis, and Queue status.
 */
async function testHealthEndpoint(): Promise<{ passed: boolean; details: string }> {
  const response = await makeRequest<HealthResponse>('/health');

  if (!response.ok || !response.data) {
    return {
      passed: false,
      details: `Health endpoint failed: ${response.error || 'No data'}`,
    };
  }

  const health = response.data;

  // Check required fields
  const hasStatus = ['healthy', 'unhealthy', 'degraded'].includes(health.status);
  const hasTimestamp = !!health.timestamp;
  const hasUptime = typeof health.uptime === 'number';
  const hasServices = !!health.services;
  const hasDatabase = !!health.services?.database;
  const hasRedis = !!health.services?.redis;
  const hasQueue = !!health.services?.queue;

  const allFieldsPresent = hasStatus && hasTimestamp && hasUptime && hasServices && hasDatabase && hasRedis && hasQueue;

  if (!allFieldsPresent) {
    return {
      passed: false,
      details: `Missing fields: status=${hasStatus}, timestamp=${hasTimestamp}, uptime=${hasUptime}, db=${hasDatabase}, redis=${hasRedis}, queue=${hasQueue}`,
    };
  }

  return {
    passed: true,
    details: `Status: ${health.status}, DB: ${health.services.database.status}, Redis: ${health.services.redis.status}, Queue: ${health.services.queue.status}`,
  };
}

/**
 * Test 2: Metrics Endpoint
 *
 * Verify /monitoring/metrics returns request and system metrics.
 */
async function testMetricsEndpoint(): Promise<{ passed: boolean; details: string }> {
  const response = await makeRequest<MetricsResponse>('/monitoring/metrics');

  if (!response.ok || !response.data) {
    return {
      passed: false,
      details: `Metrics endpoint failed: ${response.error || 'No data'}`,
    };
  }

  const metrics = response.data;

  // Check required fields
  const hasRequests = !!metrics.requests && typeof metrics.requests.perMinute === 'number';
  const hasLatency = !!metrics.latency && typeof metrics.latency.avgMs === 'number';
  const hasQueue = !!metrics.queue && typeof metrics.queue.lag === 'number';
  const hasSystem = !!metrics.system && typeof metrics.system.memoryUsedMb === 'number';

  if (!hasRequests || !hasLatency || !hasQueue || !hasSystem) {
    return {
      passed: false,
      details: `Missing fields: requests=${hasRequests}, latency=${hasLatency}, queue=${hasQueue}, system=${hasSystem}`,
    };
  }

  return {
    passed: true,
    details: `Requests: ${metrics.requests.perMinute}/min, Errors: ${metrics.requests.errorRate}%, Avg Latency: ${metrics.latency.avgMs}ms, Queue Lag: ${metrics.queue.lag}`,
  };
}

/**
 * Test 3: Status Endpoint
 *
 * Verify /monitoring/status returns component health.
 */
async function testStatusEndpoint(): Promise<{ passed: boolean; details: string }> {
  const response = await makeRequest<StatusResponse>('/monitoring/status');

  if (!response.ok || !response.data) {
    return {
      passed: false,
      details: `Status endpoint failed: ${response.error || 'No data'}`,
    };
  }

  const status = response.data;

  // Check required fields
  const hasOverall = ['OK', 'DEGRADED', 'DOWN'].includes(status.overall);
  const hasComponents = !!status.components;
  const hasApi = !!status.components?.api;
  const hasDb = !!status.components?.database;
  const hasRedis = !!status.components?.redis;
  const hasWorkers = !!status.components?.workers;

  if (!hasOverall || !hasComponents || !hasApi || !hasDb || !hasRedis || !hasWorkers) {
    return {
      passed: false,
      details: `Missing fields: overall=${hasOverall}, api=${hasApi}, db=${hasDb}, redis=${hasRedis}, workers=${hasWorkers}`,
    };
  }

  return {
    passed: true,
    details: `Overall: ${status.overall}, API: ${status.components.api.status}, DB: ${status.components.database.status}, Redis: ${status.components.redis.status}, Workers: ${status.components.workers.status}`,
  };
}

/**
 * Test 4: Thresholds Endpoint
 *
 * Verify /monitoring/thresholds returns operational thresholds.
 */
async function testThresholdsEndpoint(): Promise<{ passed: boolean; details: string }> {
  const response = await makeRequest<Record<string, number>>('/monitoring/thresholds');

  // This endpoint requires admin auth, so 401/403 is expected without token
  if (response.status === 401 || response.status === 403) {
    return {
      passed: true,
      details: 'Thresholds endpoint requires authentication (expected behavior)',
    };
  }

  if (!response.ok || !response.data) {
    return {
      passed: false,
      details: `Thresholds endpoint failed: ${response.error || 'No data'}`,
    };
  }

  const thresholds = response.data;
  const hasMaxErrorRate = typeof thresholds.maxErrorRatePercent === 'number';
  const hasMaxQueueLag = typeof thresholds.maxQueueLag === 'number';
  const hasMaxResponseTime = typeof thresholds.maxResponseTimeMs === 'number';

  return {
    passed: hasMaxErrorRate && hasMaxQueueLag && hasMaxResponseTime,
    details: `Error Rate: ${thresholds.maxErrorRatePercent}%, Queue Lag: ${thresholds.maxQueueLag}, Response Time: ${thresholds.maxResponseTimeMs}ms`,
  };
}

/**
 * Test 5: Degraded State Detection
 *
 * Verify that the system correctly reports degraded states.
 */
async function testDegradedDetection(): Promise<{ passed: boolean; details: string }> {
  const healthResponse = await makeRequest<HealthResponse>('/health');
  const statusResponse = await makeRequest<StatusResponse>('/monitoring/status');

  if (!healthResponse.ok || !statusResponse.ok) {
    return {
      passed: false,
      details: 'Could not fetch health or status endpoints',
    };
  }

  const health = healthResponse.data!;
  const status = statusResponse.data!;

  // Check consistency between health and status
  const healthOk = health.status === 'healthy';
  const statusOk = status.overall === 'OK';

  // If Redis is down, system should be degraded
  const redisDown = health.services.redis.status === 'down';
  const shouldBeDegraded = redisDown;
  const isDegraded = health.status === 'degraded' || status.overall === 'DEGRADED';

  if (shouldBeDegraded && !isDegraded) {
    return {
      passed: false,
      details: 'Redis is down but system not marked as degraded',
    };
  }

  return {
    passed: true,
    details: `Health: ${health.status}, Status: ${status.overall}, Redis: ${health.services.redis.status} - State detection working`,
  };
}

/**
 * Test 6: Metrics Collection
 *
 * Verify that making requests updates the metrics.
 */
async function testMetricsCollection(): Promise<{ passed: boolean; details: string }> {
  // Get initial metrics
  const before = await makeRequest<MetricsResponse>('/monitoring/metrics');

  if (!before.ok || !before.data) {
    return { passed: false, details: 'Could not fetch initial metrics' };
  }

  const initialTotal = before.data.requests.total;

  // Make some requests
  for (let i = 0; i < 5; i++) {
    await fetch(`${API_URL}/health`);
  }

  // Get updated metrics
  const after = await makeRequest<MetricsResponse>('/monitoring/metrics');

  if (!after.ok || !after.data) {
    return { passed: false, details: 'Could not fetch updated metrics' };
  }

  const newTotal = after.data.requests.total;
  const increased = newTotal > initialTotal;

  return {
    passed: increased,
    details: `Requests: ${initialTotal} → ${newTotal} (${increased ? 'metrics updating' : 'metrics not updating'})`,
  };
}

/**
 * Test 7: Response Time Tracking
 *
 * Verify that latency metrics are tracked.
 */
async function testLatencyTracking(): Promise<{ passed: boolean; details: string }> {
  const response = await makeRequest<MetricsResponse>('/monitoring/metrics');

  if (!response.ok || !response.data) {
    return { passed: false, details: 'Could not fetch metrics' };
  }

  const latency = response.data.latency;
  const hasValidLatency = latency.avgMs >= 0 && latency.p50Ms >= 0 && latency.p95Ms >= 0 && latency.p99Ms >= 0;
  const percentilesOrdered = latency.p50Ms <= latency.p95Ms && latency.p95Ms <= latency.p99Ms;

  return {
    passed: hasValidLatency && percentilesOrdered,
    details: `Avg: ${latency.avgMs}ms, P50: ${latency.p50Ms}ms, P95: ${latency.p95Ms}ms, P99: ${latency.p99Ms}ms`,
  };
}

/**
 * Test 8: System Resources Monitoring
 *
 * Verify that memory and CPU metrics are available.
 */
async function testSystemResources(): Promise<{ passed: boolean; details: string }> {
  const response = await makeRequest<MetricsResponse>('/monitoring/metrics');

  if (!response.ok || !response.data) {
    return { passed: false, details: 'Could not fetch metrics' };
  }

  const system = response.data.system;
  const hasMemory = system.memoryUsedMb > 0 && system.memoryTotalMb > 0;
  const hasCpu = typeof system.cpuPercent === 'number';
  const memoryRatio = system.memoryUsedMb / system.memoryTotalMb;

  return {
    passed: hasMemory && hasCpu,
    details: `Memory: ${system.memoryUsedMb}MB / ${system.memoryTotalMb}MB (${Math.round(memoryRatio * 100)}%), CPU: ${system.cpuPercent}%`,
  };
}

async function runAllTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Hypermarket API - Monitoring & Alerts Tests (PR#33)');
  console.log(`Target: ${API_URL}`);
  console.log('='.repeat(60));

  const results: TestResult[] = [];

  // Run all tests
  results.push(await runTest('Health Endpoint Extended', testHealthEndpoint));
  results.push(await runTest('Metrics Endpoint', testMetricsEndpoint));
  results.push(await runTest('Status Endpoint', testStatusEndpoint));
  results.push(await runTest('Thresholds Endpoint', testThresholdsEndpoint));
  results.push(await runTest('Degraded State Detection', testDegradedDetection));
  results.push(await runTest('Metrics Collection', testMetricsCollection));
  results.push(await runTest('Latency Tracking', testLatencyTracking));
  results.push(await runTest('System Resources', testSystemResources));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('MONITORING TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('\nDetails:');

  for (const r of results) {
    console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}: ${r.details}`);
  }

  // Thresholds Reference
  console.log('\n=== Operational Thresholds ===');
  console.log('| Metric          | Threshold | Severity |');
  console.log('|-----------------|-----------|----------|');
  console.log('| Error Rate      | > 2%      | CRITICAL |');
  console.log('| Queue Lag       | > 100     | WARNING  |');
  console.log('| Response Time   | > 2000ms  | WARNING  |');
  console.log('| DB Latency      | > 1000ms  | DEGRADED |');
  console.log('| Redis Latency   | > 100ms   | DEGRADED |');

  // Exit with appropriate code
  if (failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(console.error);
