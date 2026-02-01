const appStartMs = Date.now();
const loggedMetrics = new Set<string>();

function logMetric(name: string, valueMs: number) {
  if (!__DEV__) return;
  if (loggedMetrics.has(name)) return;
  loggedMetrics.add(name);
  console.log(`[perf] ${name}: ${Math.round(valueMs)}ms`);
}

export function markTTI() {
  logMetric('TTI', Date.now() - appStartMs);
}

export function markHomeFirstRender() {
  logMetric('Home first render', Date.now() - appStartMs);
}

export function markProductsCached() {
  logMetric('Products cached render', Date.now() - appStartMs);
}

export function markProductsNetworkUpdate() {
  logMetric('Products network update', Date.now() - appStartMs);
}
