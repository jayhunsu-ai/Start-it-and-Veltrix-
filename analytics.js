/**
 * lib/analytics.js
 *
 * Baseline: every event lands in Supabase's `events` table — zero extra
 * cost, zero extra signup, works the moment Supabase is configured.
 *
 * Optional: if POSTHOG_API_KEY is set, the same event is also forwarded
 * to PostHog (free tier: 1M events/mo) for funnels, retention, and a
 * real dashboard without building one yourself.
 *
 * Fire-and-forget by design — analytics must never slow down or break
 * a user-facing request. Every call here is wrapped so a failure here
 * is a console.error, not a 500 to the client.
 */

const { db } = require("./supabase");

let posthogClient = null;
if (process.env.POSTHOG_API_KEY) {
  try {
    const { PostHog } = require("posthog-node");
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1, // low-traffic app; don't hold events in a batch buffer
    });
  } catch {
    console.warn("POSTHOG_API_KEY set but posthog-node isn't installed — skipping PostHog forwarding.");
  }
}

/**
 * track — call this, don't await it, from any route.
 *
 * @param {string} event   - snake_case event name, e.g. "readiness_score_generated"
 * @param {object} [props] - flat object of properties. Always include userId
 *                            when known; distinct_id falls back to "anonymous"
 *                            for pre-signup funnel steps.
 */
function track(event, props = {}) {
  const { userId, ...rest } = props;
  const distinctId = userId || "anonymous";

  if (db) {
    db.from("events")
      .insert({ event, user_id: userId || null, properties: rest })
      .then(({ error }) => {
        if (error) console.error("analytics(supabase):", error.message);
      });
  }

  if (posthogClient) {
    try {
      posthogClient.capture({ distinctId, event, properties: rest });
    } catch (e) {
      console.error("analytics(posthog):", e.message);
    }
  }
}

module.exports = { track };
