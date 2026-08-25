const express = require("express");
const { call_model } = require("../lib/modelRouter");
const { getOrCompute } = require("../lib/cache");
const { idempotent } = require("../lib/idempotency");
const { db } = require("../lib/supabase");
const { DRAPER, APPRAISER, STYLIST, APPRENTICE_MASTER } = require("../lib/personas_extra");
const router = express.Router();

/**
 * tools_extra.js — tools 5 through 9.
 * Same discipline as tools.js: cache reads, idempotent writes, typed
 * error mapping via respondToModelError, never leak provider details.
 */

function respondToModelError(err, res) {
  console.error(err.message);
  switch (err.kind) {
    case "all_rate_limited":
      return res.status(429).json({ error: "We're at capacity right now. Try again in about a minute." });
    case "all_unconfigured":
      return res.status(503).json({ error: "This tool isn't configured yet — missing provider keys." });
    default:
      return res.status(502).json({ error: "Generation failed", detail: "upstream provider error" });
  }
}

// ---------------------------------------------------------------
// TOOL 5 — Website Preview  (tool "d" across all three segments)
// ---------------------------------------------------------------

// POST /api/tools/website-preview
router.post("/website-preview", async (req, res) => {
  const { idea, segment } = req.body;
  if (!idea || idea.length < 5) return res.status(400).json({ error: "Describe the business in a bit more detail." });

  try {
    const result = await getOrCompute("website-preview", { idea, segment }, 30 * 60 * 1000, async () => {
      const { text } = await call_model("FAST", [
        { role: "system", content: DRAPER },
        { role: "user", content: `Segment: ${segment || "new"}\nDescription: ${idea}` },
      ]);
      return JSON.parse(text);
    });
    res.json(result);
  } catch (e) {
    respondToModelError(e, res);
  }
});

// ---------------------------------------------------------------
// TOOL 6 — Identity Mood Board  (Pollinations-backed image generation)
// ---------------------------------------------------------------

// POST /api/tools/mood-board
router.post("/mood-board", async (req, res) => {
  const { brandDescription } = req.body;
  if (!brandDescription || brandDescription.length < 5) {
    return res.status(400).json({ error: "Describe the brand direction in a bit more detail." });
  }
  if (!process.env.POLLINATIONS_API_KEY) {
    return res.status(503).json({ error: "Visual generation isn't configured yet — missing POLLINATIONS_API_KEY." });
  }

  try {
    const result = await getOrCompute("mood-board", { brandDescription }, 60 * 60 * 1000, async () => {
      // Step 1: turn the loose description into a concrete image prompt
      const { text } = await call_model("FAST", [
        { role: "system", content: STYLIST },
        { role: "user", content: brandDescription },
      ]);
      const { image_prompt, style_notes } = JSON.parse(text);

      // Step 2: generate the actual image via Pollinations
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(image_prompt)}?width=1024&height=1024&nologo=true`;
      const imgRes = await fetch(imageUrl, {
        headers: { Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}` },
      });
      if (!imgRes.ok) throw new Error(`pollinations:${imgRes.status}`);

      // Pollinations returns the image bytes directly at that URL — for a
      // browser <img src>, the URL itself (with a referrer-safe token
      // param, not embedded here) is what the frontend uses. We just
      // confirm it resolved before handing the URL back.
      return { image_url: imageUrl, style_notes };
    });
    res.json(result);
  } catch (e) {
    console.error(e.message);
    res.status(502).json({ error: "Couldn't generate the mood board right now." });
  }
});

// ---------------------------------------------------------------
// TOOL 7 — Brand Health Check  (tool "a" for the "scale" segment)
// No crawler service — a plain server-side fetch + tag-strip is
// enough for a single page's visible text, and it's one less service
// to configure keys for.
// ---------------------------------------------------------------

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000); // keep the prompt bounded regardless of page size
}

// POST /api/tools/brand-health-check
router.post("/brand-health-check", async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: "A website URL or handle is required." });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const result = await getOrCompute("brand-health-check", { url }, 60 * 60 * 1000, async () => {
      const pageRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!pageRes.ok) throw new Error(`fetch_target:${pageRes.status}`);
      const html = await pageRes.text();
      const visibleText = stripHtml(html);
      if (!visibleText) throw new Error("no_visible_text");

      const { text } = await call_model("FAST", [
        { role: "system", content: APPRAISER },
        { role: "user", content: visibleText },
      ]);
      return JSON.parse(text);
    });
    res.json(result);
  } catch (e) {
    console.error(e.message);
    if (e.message.startsWith("fetch_target") || e.message === "no_visible_text") {
      return res.status(422).json({ error: "Couldn't read that page. Check the URL and that the site is public." });
    }
    respondToModelError(e, res);
  }
});

// ---------------------------------------------------------------
// TOOL 8 — FutureMe Letters
// ---------------------------------------------------------------

// POST /api/tools/future-letter   (Idempotency-Key required)
router.post(
  "/future-letter",
  idempotent(async (req, res) => {
    const { userId, letterText, deliverAt } = req.body;
    if (!userId || !letterText || !deliverAt) {
      return res.status(400).json({ error: "userId, letterText, and deliverAt are required." });
    }
    if (!db) return res.status(503).json({ error: "Database not configured yet." });

    const idempotencyKey = req.header("Idempotency-Key");
    const { data, error } = await db
      .from("future_letters")
      .insert({ user_id: userId, letter_text: letterText, deliver_at: deliverAt })
      .select()
      .single();

    if (error) return res.status(502).json({ error: "Couldn't schedule the letter.", detail: error.message });
    res.status(201).json(data);
  })
);

// ---------------------------------------------------------------
// TOOL 9 — Skills-Track Matcher  (the "learn" segment's free tool)
// ---------------------------------------------------------------

// POST /api/tools/skills-match
router.post("/skills-match", async (req, res) => {
  const { answers } = req.body; // { interests, workingStyle, ... } — structured, not free text
  if (!answers) return res.status(400).json({ error: "Answers are required." });

  try {
    const result = await getOrCompute("skills-match", { answers }, 30 * 60 * 1000, async () => {
      const { text } = await call_model("FAST", [
        { role: "system", content: APPRENTICE_MASTER },
        { role: "user", content: JSON.stringify(answers) },
      ]);
      return JSON.parse(text);
    });
    res.json(result);
  } catch (e) {
    respondToModelError(e, res);
  }
});

module.exports = router;
