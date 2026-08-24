/**
 * lib/cache.js
 *
 * In-memory TTL cache with in-flight coalescing.
 *
 * Two problems solved here, not one:
 *
 * 1. TTL cache — avoid burning a provider call for the same input twice
 *    within the TTL window (30–60 min depending on tool). On free-tier
 *    providers, rate limits are the constraint, not latency.
 *
 * 2. In-flight coalescing — if two requests arrive for the exact same
 *    cache key before the first has resolved (e.g. user double-clicks,
 *    or frontend fires on mount AND on a click), the second request waits
 *    on the first promise instead of launching a second provider call.
 *    This is the "stuck spinner" guard mentioned in modelRouter.js.
 *
 * For a single Render instance this is enough. If you scale to multiple
 * replicas, swap `store` and `inflight` for Redis — the interface stays
 * the same, only the backing store changes.
 */

// key -> { value: any, expiresAt: number }
const store = new Map();

// key -> Promise  (in-flight coalescing)
const inflight = new Map();

/**
 * Stable cache key from tool name + params object.
 * JSON.stringify is deterministic enough for our use case — all param
 * objects are small and have the same structure on every call for a
 * given tool, so key ordering is consistent.
 */
function cacheKey(toolName, params) {
  return `${toolName}:${JSON.stringify(params)}`;
}

/**
 * getOrCompute
 *
 * @param {string} toolName     - used as a namespace in the key
 * @param {object} params       - the input that determines uniqueness
 * @param {number} ttlMs        - how long to keep the value (ms)
 * @param {() => Promise<any>}  fn - the expensive thing to do on a miss
 * @returns {Promise<any>}      - the value, from cache or freshly computed
 */
async function getOrCompute(toolName, params, ttlMs, fn) {
  const key = cacheKey(toolName, params);

  // 1. Cache hit
  const cached = store.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // 2. In-flight — another request is already computing this key
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  // 3. Cache miss — compute, store, clean up in-flight entry
  const promise = fn()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

module.exports = { getOrCompute };
