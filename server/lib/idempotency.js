/**
 * lib/idempotency.js
 *
 * Middleware wrapper for write endpoints that must not execute twice
 * for the same logical request (e.g. "place extras order").
 *
 * Two-layer guarantee:
 *   Layer 1 (this file)  — in-process Map. Catches double-submits that
 *     arrive on the same Node process before the first resolves.
 *   Layer 2 (tools.js + schema) — DB unique constraint on idempotency_key.
 *     Catches anything that slips through (multi-replica deploy, process
 *     restart between submit and response, etc.).
 *
 * The client generates one UUID per button press and sends it as the
 * `Idempotency-Key` header. On retry after a network error it sends the
 * SAME key — so the server can tell "retry for the same intent" from
 * "a new order".
 *
 * Usage:
 *   router.post("/extras-order", idempotent(async (req, res) => { ... }));
 */

// key -> Promise<responseBody>
const seen = new Map();

// How long to remember a key in process memory.
// 24 h matches a typical "session" and keeps the Map from growing forever.
const TTL_MS = 24 * 60 * 60 * 1000;

function idempotent(handler) {
  return async (req, res) => {
    const key = req.header("Idempotency-Key");

    if (!key) {
      return res
        .status(400)
        .json({ error: "Idempotency-Key header is required for this endpoint." });
    }

    // Already seen — wait on the existing promise and return its result
    if (seen.has(key)) {
      try {
        const cached = await seen.get(key);
        return res.status(200).json(cached);
      } catch {
        // The original request failed — tell the client to use a new key
        return res.status(409).json({
          error: "A previous request with this key failed. Use a fresh Idempotency-Key to retry.",
        });
      }
    }

    // First time seeing this key — run the handler and capture its response
    let resolveCapture, rejectCapture;
    const promise = new Promise((res, rej) => {
      resolveCapture = res;
      rejectCapture  = rej;
    });

    seen.set(key, promise);
    setTimeout(() => seen.delete(key), TTL_MS);

    // Intercept res.json so we can capture the body for future callers
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      resolveCapture(body);
      return originalJson(body);
    };

    try {
      await handler(req, res);
    } catch (err) {
      rejectCapture(err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error." });
      }
    }
  };
}

module.exports = { idempotent };
