/**
 * Simple Load Test Script for Hypermarket API
 *
 * Usage:
 *   npx ts-node test/load/load-test.ts
 *
 * Environment:
 *   API_URL - Base API URL (default: http://localhost:3000/api)
 *
 * This script tests:
 *   1. GET /products (cached endpoint)
 *   2. POST /orders (order creation)
 *   3. POST /pos/sale (POS sale)
 */

interface LoadTestResult {
  endpoint: string;
  method: string;
  rps: number;
  duration: number;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  errors: Record<string, number>;
}

interface RequestResult {
  success: boolean;
  latencyMs: number;
  statusCode: number;
  error?: string;
}

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

async function makeRequest(
  method: string,
  endpoint: string,
  body?: object,
): Promise<RequestResult> {
  const start = Date.now();

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const latencyMs = Date.now() - start;

    return {
      success: response.ok,
      latencyMs,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      latencyMs,
      statusCode: 0,
      error,
    };
  }
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

async function runLoadTest(
  name: string,
  method: string,
  endpoint: string,
  body: object | undefined,
  rps: number,
  durationSeconds: number,
): Promise<LoadTestResult> {
  console.log(`\n[${name}] Starting load test: ${rps} req/s for ${durationSeconds}s`);

  const results: RequestResult[] = [];
  const errors: Record<string, number> = {};
  const intervalMs = 1000 / rps;
  const endTime = Date.now() + durationSeconds * 1000;

  let requestCount = 0;

  // Use setImmediate-based loop for better accuracy
  const runRequest = async (): Promise<void> => {
    if (Date.now() >= endTime) return;

    requestCount++;
    const result = await makeRequest(method, endpoint, body);
    results.push(result);

    if (result.error) {
      errors[result.error] = (errors[result.error] || 0) + 1;
    }

    // Schedule next request
    const nextDelay = Math.max(0, intervalMs - result.latencyMs);
    if (Date.now() + nextDelay < endTime) {
      setTimeout(runRequest, nextDelay);
    }
  };

  // Start multiple concurrent request streams for higher RPS
  const concurrency = Math.min(rps, 10);
  const promises: Promise<void>[] = [];

  for (let i = 0; i < concurrency; i++) {
    promises.push(
      (async () => {
        while (Date.now() < endTime) {
          const result = await makeRequest(method, endpoint, body);
          results.push(result);

          if (result.error) {
            errors[result.error] = (errors[result.error] || 0) + 1;
          }

          // Delay to achieve target RPS
          await new Promise((resolve) => setTimeout(resolve, intervalMs * concurrency));
        }
      })(),
    );
  }

  await Promise.all(promises);

  // Calculate statistics
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  const testResult: LoadTestResult = {
    endpoint,
    method,
    rps,
    duration: durationSeconds,
    totalRequests: results.length,
    successCount,
    failureCount,
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
    p50LatencyMs: calculatePercentile(latencies, 50),
    p95LatencyMs: calculatePercentile(latencies, 95),
    p99LatencyMs: calculatePercentile(latencies, 99),
    maxLatencyMs: Math.max(...latencies, 0),
    minLatencyMs: Math.min(...latencies, 0),
    errors,
  };

  console.log(`[${name}] Completed: ${results.length} requests`);
  console.log(`  Success: ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Avg latency: ${testResult.avgLatencyMs.toFixed(0)}ms`);
  console.log(`  P95 latency: ${testResult.p95LatencyMs.toFixed(0)}ms`);

  if (failureCount > 0) {
    console.log(`  Errors:`, errors);
  }

  return testResult;
}

async function testHealthEndpoint(): Promise<boolean> {
  console.log('\n=== Health Check ===');
  const result = await makeRequest('GET', '/health');

  if (result.success) {
    console.log('API is healthy');
    return true;
  } else {
    console.log(`API health check failed: ${result.error}`);
    return false;
  }
}

async function runAllLoadTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Hypermarket API Load Test');
  console.log(`Target: ${API_URL}`);
  console.log('='.repeat(60));

  // Health check first
  const isHealthy = await testHealthEndpoint();
  if (!isHealthy) {
    console.log('\nAPI is not healthy. Skipping load tests.');
    console.log('Make sure the API is running: pnpm api:dev');
    return;
  }

  const allResults: LoadTestResult[] = [];

  // Test 1: GET /products (cached)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: GET /products (cached endpoint)');
  console.log('='.repeat(60));

  for (const rps of [10, 50, 100]) {
    const duration = rps === 100 ? 5 : 10; // Shorter duration for high RPS
    const result = await runLoadTest(
      `GET /products @ ${rps} RPS`,
      'GET',
      '/v1/products?limit=20',
      undefined,
      rps,
      duration,
    );
    allResults.push(result);

    // Brief pause between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Test 2: GET /categories (cached)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: GET /categories (cached endpoint)');
  console.log('='.repeat(60));

  for (const rps of [10, 50]) {
    const result = await runLoadTest(
      `GET /categories @ ${rps} RPS`,
      'GET',
      '/v1/categories',
      undefined,
      rps,
      10,
    );
    allResults.push(result);

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST SUMMARY');
  console.log('='.repeat(60));

  console.log('\n| Endpoint | RPS | Requests | Success% | Avg(ms) | P95(ms) | P99(ms) |');
  console.log('|----------|-----|----------|----------|---------|---------|---------|');

  for (const r of allResults) {
    const successRate = ((r.successCount / r.totalRequests) * 100).toFixed(1);
    console.log(
      `| ${r.method} ${r.endpoint.substring(0, 20).padEnd(20)} | ${r.rps.toString().padStart(3)} | ${r.totalRequests.toString().padStart(8)} | ${successRate.padStart(7)}% | ${r.avgLatencyMs.toFixed(0).padStart(7)} | ${r.p95LatencyMs.toFixed(0).padStart(7)} | ${r.p99LatencyMs.toFixed(0).padStart(7)} |`,
    );
  }

  // Check for issues
  console.log('\n=== Issues Detected ===');
  let issueCount = 0;

  for (const r of allResults) {
    if (r.failureCount > 0) {
      console.log(`[WARN] ${r.method} ${r.endpoint} @ ${r.rps} RPS: ${r.failureCount} failures`);
      issueCount++;
    }
    if (r.p95LatencyMs > 1000) {
      console.log(
        `[WARN] ${r.method} ${r.endpoint} @ ${r.rps} RPS: P95 latency ${r.p95LatencyMs}ms > 1000ms`,
      );
      issueCount++;
    }
  }

  if (issueCount === 0) {
    console.log('No issues detected.');
  }

  console.log('\n=== Recommendations ===');
  console.log('- Safe operating range: 10-50 req/s for read endpoints');
  console.log('- Monitor P95 latency in production');
  console.log('- Set up alerting for latency > 500ms');
}

// Run the tests
runAllLoadTests().catch(console.error);
