const express = require("express");
const { db } = require("../lib/supabase");
const router = express.Router();

/**
 * routes/analytics.js
 *
 * One endpoint: a funnel count across the events your track() calls
 * already emit. This is what backs a real "traction" number for
 * judges — pulled from actual usage, not written by hand into a deck.
 *
 * Add track() calls at each meaningful step as you wire the frontend:
 *   segment_selected -> tool_used -> tier_selected -> extras_ordered
 *   -> booking_created -> post_published
 */

const FUNNEL_STEPS = [
  "segment_selected",
  "tool_used",
  "tier_selected",
  "extras_ordered",
  "booking_created",
  "post_published",
];

// GET /api/analytics/funnel
router.get("/funnel", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Analytics isn't configured yet — Supabase keys missing." });

  try {
    const counts = {};
    for (const step of FUNNEL_STEPS) {
      const { count, error } = await db
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("event", step);
      if (error) throw error;
      counts[step] = count || 0;
    }
    res.json({ funnel: counts, generated_at: new Date().toISOString() });
  } catch (e) {
    console.error(e.message);
    res.status(502).json({ error: "Couldn't compute the funnel right now." });
  }
});

module.exports = router;
