# PR-N Performance: Cache-first + <2s Launch

## Summary
- Introduced a lightweight AsyncStorage cache layer with explicit TTLs for Home data.
- Home now renders cached categories/products immediately and only revalidates when stale.
- Added background cart mutation queue to keep “Add” optimistic while syncing in the background.
- Deferred non-critical prefetching until after interactions and removed startup blocking on font loading.
- Added dev-only performance instrumentation for TTI, Home first render, cached products render, and network refresh.

## What Changed
1. **Cache layer**
   - AsyncStorage-backed cache with TTLs per content type.
   - Queries hydrate from cache first, then revalidate when stale (stale-while-revalidate).

2. **Home fetch strategy**
   - Cache-first reads on mount.
   - Background refresh only when TTL is expired.
   - Parallel fetches for stale categories + featured products.
   - In-flight request dedupe at the API client level to prevent duplicate calls.

3. **Optimistic cart sync**
   - “Add” updates UI instantly.
   - Background API sync with retry queue; client errors stop retries without rolling back UI.

4. **Startup**
   - Splash no longer blocks rendering while fonts load.
   - Non-critical work deferred to after initial interactions.

5. **Instrumentation**
   - Dev-only console metrics:
     - TTI
     - Home first render
     - Products cached render
     - Products network update

## TTLs
- **categories:** 24h
- **featured/best-sellers:** 60m
- **home feed/products list:** 10m

## Why
- Eliminate long spinners on Home by using cache-first rendering.
- Reduce redundant network requests while keeping data fresh.
- Keep “Add to cart” instant regardless of network latency.
- Ensure startup meets the <2s target by avoiding blocking work.

## Monitor
- Console perf logs in dev for regression signals.
- Cache hit rate and stale refresh frequency.
- Cart sync queue growth (should drain quickly when online).
