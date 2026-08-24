const express = require("express");
const { call_model } = require("../lib/modelRouter");
const { getOrCompute } = require("../lib/cache");
const { idempotent } = require("../lib/idempotency");
const { db } = require("../lib/supabase");
const { CUTTER, FITTER, PATTERN_MAKER, SELVAGE } = require("../lib/personas");
const router = express.Router();

/**
 * Maps a typed error from modelRouter (see ProviderError / call_model's
 * aggregate .kind) to the right HTTP status and a message that's safe
 * and useful to show a user — never leak provider names/keys/raw errors
 * to the client.
 */
function respondToModelError(err, res) {
  console.error(err.message); // full detail goes to server logs only
  switch (err.kind) {
    case "all_rate_limited":
      return res.status(429).json({ error: "We're at capacity right now. Try again in about a minute." });
    case "all_unconfigured":
      return res.status(503).json({ error: "This tool isn't configured yet — missing provider keys." });
    default:
      return res.status(502).json({ error: "Generation failed", detail: "upstream provider error" });
  }
}

/**
 * Every read-only tool below:
 *  - validates input
 *  - builds a scoped prompt (no leaking internal architecture names)
 *  - checks the TTL cache before spending a provider call (see cache.js)
 *  - calls the router with the right task type
 *  - returns structured JSON, never raw model text, so the frontend
 *    never has to parse prose
 *
 * Any endpoint that WRITES (order creation) is wrapped in `idempotent()`
 * instead — see idempotency.js for why these are two different problems.
 */

// POST /api/tools/name-tagline
router.post("/name-tagline", async (req, res) => {
  const { idea } = req.body;
  if (!idea || idea.length < 5) return res.status(400).json({ error: "Describe your idea in a bit more detail." });

  try {
    const result = await getOrCompute("name-tagline", { idea }, 30 * 60 * 1000, async () => {
      const { text } = await call_model("FAST", [
        { role: "system", content: CUTTER },
        { role: "user", content: idea },
      ]);
      return JSON.parse(text);
    });
    res.json(result);
  } catch (e) {
    respondToModelError(e, res);
  }
});

// POST /api/tools/readiness-score
router.post("/readiness-score", async (req, res) => {
  const { answers, userId } = req.body; // structured intake answers, not free text
  try {
    const result = await getOrCompute("readiness-score", { answers }, 30 * 60 * 1000, async () => {
      const { text } = await call_model("FAST", [
        { role: "system", content: FITTER },
        { role: "user", content: JSON.stringify(answers) },
      ]);
      return JSON.parse(text);
    });

    // Persist so the dashboard has history to show — fire-and-forget,
    // never let a DB hiccup fail a response the user is waiting on.
    if (db && userId) {
      db.from("brand_snapshots")
        .insert({
          user_id: userId,
          readiness_score: result.score,
          strengths: result.strengths,
          gaps: result.gaps,
          summary: result.summary,
        })
        .then(({ error }) => {
          if (error) console.error("brand_snapshots insert failed:", error.message);
        });
    }

    res.json(result);
  } catch (e) {
    respondToModelError(e, res);
  }
});

// POST /api/tools/pain-point-finder
router.post("/pain-point-finder", async (req, res) => {
  const { customerDescription } = req.body;
  try {
    const result = await getOrCompute(
      "pain-point-finder",
      { customerDescription },
      30 * 60 * 1000,
      async () => {
        const { text } = await call_model("FAST", [
          { role: "system", content: PATTERN_MAKER },
          { role: "user", content: customerDescription },
        ]);
        return JSON.parse(text);
      }
    );
    res.json(result);
  } catch (e) {
    respondToModelError(e, res);
  }
});

// POST /api/tools/legal-check  (Start-It Legal Check — AI first pass, human CAC agent closes out)
router.post("/legal-check", async (req, res) => {
  const { documentText } = req.body;
  if (!documentText) return res.status(400).json({ error: "No document text provided." });

  try {
    // Cached by document hash — a re-uploaded/resubmitted contract (very
    // common: person clicks "check" again after tweaking one clause,
    // or navigates back) doesn't need to re-burn a LONGCTX call.
    const result = await getOrCompute("legal-check", { documentText }, 60 * 60 * 1000, async () => {
      const { text } = await call_model("LONGCTX", [
        { role: "system", content: SELVAGE },
        { role: "user", content: documentText },
      ]);
      return JSON.parse(text);
    });

    res.json({
      ...result,
      note: "AI first-pass only. Medium/high risk items are routed to a human CAC agent for final review before any filing.",
    });
  } catch (e) {
    respondToModelError(e, res);
  }
});

// POST /api/tools/extras-order  (the write path — idempotency matters here, not caching)
// Client must send an `Idempotency-Key` header, generated once per button press.
router.post(
  "/extras-order",
  idempotent(async (req, res) => {
    const { userId, extraType } = req.body;
    const VALID_TYPES = ["brand_kit", "product_manager", "smm", "cac_agent", "legal_check", "media_kit"];

    if (!userId || !VALID_TYPES.includes(extraType)) {
      return res.status(400).json({ error: "userId and a valid extraType are required." });
    }
    if (!db) {
      return res.status(503).json({ error: "Database not configured yet (Step 2 in PROD_READY_STEPS.md)." });
    }

    const idempotencyKey = req.header("Idempotency-Key");
    const { data, error } = await db
      .from("extras_orders")
      .insert({ user_id: userId, extra_type: extraType, idempotency_key: idempotencyKey })
      .select()
      .single();

    if (error) {
      // Unique-violation on idempotency_key = a real double-submit slipped
      // past the in-process middleware (e.g. two backend replicas). The
      // DB constraint is the actual guarantee; return the existing row.
      if (error.code === "23505") {
        const { data: existing } = await db
          .from("extras_orders")
          .select()
          .eq("idempotency_key", idempotencyKey)
          .single();
        return res.status(200).json(existing);
      }
      return res.status(502).json({ error: "Order creation failed", detail: error.message });
    }

    res.status(201).json(data);
  })
);

module.exports = router;
