const express = require("express");
const { idempotent } = require("../lib/idempotency");
const { getOrCompute } = require("../lib/cache");
const { db } = require("../lib/supabase");
const { track } = require("../lib/analytics");
const router = express.Router();

/**
 * integrations.js
 *
 * Cal.com (booking), Postiz (social posting), Documenso (e-signature).
 *
 * Same discipline as tools.js:
 *  - graceful degradation: missing key => 503 with a clear message,
 *    never a crash, never a silent no-op that pretends it worked
 *  - writes go through idempotent() — a booking or a post fired twice
 *    on a flaky connection is a real-world incident, not an edge case
 *  - never leak upstream error bodies/keys to the client
 */

function requireKey(envVar, label, res) {
  if (!process.env[envVar]) {
    res.status(503).json({ error: `${label} isn't configured yet — missing ${envVar}.` });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------
// CAL.COM — booking
// ---------------------------------------------------------------

// GET /api/integrations/calcom/availability?eventTypeId=...
router.get("/calcom/availability", async (req, res) => {
  if (!requireKey("CALCOM_API_KEY", "Booking", res)) return;
  const { eventTypeId } = req.query;
  if (!eventTypeId) return res.status(400).json({ error: "eventTypeId is required." });

  try {
    // Cached briefly — availability doesn't need to be re-fetched on every keystroke
    const slots = await getOrCompute("calcom-availability", { eventTypeId }, 2 * 60 * 1000, async () => {
      const r = await fetch(
        `https://api.cal.com/v2/slots?eventTypeId=${encodeURIComponent(eventTypeId)}`,
        { headers: { Authorization: `Bearer ${process.env.CALCOM_API_KEY}` } }
      );
      if (!r.ok) throw new Error(`calcom:${r.status}`);
      return r.json();
    });
    res.json(slots);
  } catch (e) {
    console.error(e.message);
    res.status(502).json({ error: "Couldn't load available times right now." });
  }
});

// POST /api/integrations/calcom/book   (Idempotency-Key required)
router.post(
  "/calcom/book",
  idempotent(async (req, res) => {
    if (!requireKey("CALCOM_API_KEY", "Booking", res)) return;
    const { eventTypeId, start, attendeeEmail, attendeeName, userId } = req.body;
    if (!eventTypeId || !start || !attendeeEmail) {
      return res.status(400).json({ error: "eventTypeId, start, and attendeeEmail are required." });
    }

    try {
      const r = await fetch("https://api.cal.com/v2/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTypeId,
          start,
          attendee: { email: attendeeEmail, name: attendeeName || attendeeEmail },
        }),
      });
      if (!r.ok) throw new Error(`calcom_booking:${r.status}`);
      const booking = await r.json();

      if (db && userId) {
        await db.from("extras_orders").insert({
          user_id: userId,
          extra_type: "brand_strategy_session",
          status: "requested",
        });
      }
      track("booking_created", { userId, source: "calcom" });

      res.json({ confirmed: true, booking });
    } catch (e) {
      console.error(e.message);
      res.status(502).json({ error: "Booking failed. Nothing was charged or reserved." });
    }
  })
);

// ---------------------------------------------------------------
// BUFFER — social posting ("Go Live" step)
// Buffer's API is GraphQL, single endpoint, verified against their
// published docs/examples (developers.buffer.com) rather than
// inferred — createPost takes one channelId (not a list) and
// returns a union type: PostActionSuccess | MutationError.
// ---------------------------------------------------------------

const BUFFER_ENDPOINT = "https://api.buffer.com";

async function bufferGraphQL(query, variables) {
  const r = await fetch(BUFFER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BUFFER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(`buffer:${r.status}`);
  const data = await r.json();
  if (data.errors?.length) throw new Error(`buffer_graphql:${data.errors[0].message}`);
  return data.data;
}

// POST /api/integrations/buffer/post   (Idempotency-Key required)
// Posts to one channel per call — for multi-channel "Go Live", the
// frontend calls this once per selected channel.
router.post(
  "/buffer/post",
  idempotent(async (req, res) => {
    if (!requireKey("BUFFER_API_KEY", "Social posting", res)) return;
    const { channelId, content, userId } = req.body;
    if (!channelId || !content) {
      return res.status(400).json({ error: "channelId and content are required." });
    }

    try {
      const result = await bufferGraphQL(
        `mutation CreatePost($input: CreatePostInput!) {
           createPost(input: $input) {
             ... on PostActionSuccess { post { id text } }
             ... on MutationError { message }
           }
         }`,
        { input: { text: content, channelId, schedulingType: "automatic", mode: "shareNow" } }
      );

      // Union type — Buffer returns 200 even on a rejected post, the
      // failure shows up as a MutationError object, not an HTTP error.
      if (result.createPost?.message) {
        throw new Error(`buffer_rejected:${result.createPost.message}`);
      }

      track("post_published", { userId, channelId });
      res.json({ posted: true, post: result.createPost.post });
    } catch (e) {
      console.error(e.message);
      res.status(502).json({ error: "Post failed to go out. Nothing was published." });
    }
  })
);

// GET /api/integrations/buffer/channels?userId=...
router.get("/buffer/channels", async (req, res) => {
  if (!requireKey("BUFFER_API_KEY", "Social posting", res)) return;
  try {
    const result = await bufferGraphQL(
      `query GetOrganizations {
         account { organizations { id channels { id service } } }
       }`
    );
    const channels = (result.account?.organizations || []).flatMap((org) => org.channels || []);
    res.json(channels);
  } catch (e) {
    console.error(e.message);
    res.status(502).json({ error: "Couldn't load connected channels." });
  }
});

// ---------------------------------------------------------------
// DOCUMENSO — e-signature (contract review extra, closes the loop
// after /api/tools/legal-check flags something for human review)
// ---------------------------------------------------------------

// POST /api/integrations/documenso/create-envelope   (Idempotency-Key required)
router.post(
  "/documenso/create-envelope",
  idempotent(async (req, res) => {
    if (!requireKey("DOCUMENSO_API_KEY", "Document signing", res)) return;
    const { title, recipientEmail, recipientName, documentUrl, userId } = req.body;
    if (!title || !recipientEmail || !documentUrl) {
      return res.status(400).json({ error: "title, recipientEmail, and documentUrl are required." });
    }

    try {
      const r = await fetch("https://app.documenso.com/api/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DOCUMENSO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          recipients: [{ email: recipientEmail, name: recipientName || recipientEmail }],
          fileUrl: documentUrl,
        }),
      });
      if (!r.ok) throw new Error(`documenso:${r.status}`);
      const envelope = await r.json();

      if (db && userId) {
        await db.from("extras_orders").insert({
          user_id: userId,
          extra_type: "legal_check",
          status: "human_review",
        });
      }
      track("contract_sent_for_signature", { userId });

      res.json({ sent: true, envelope });
    } catch (e) {
      console.error(e.message);
      res.status(502).json({ error: "Couldn't send the document for signature." });
    }
  })
);

module.exports = router;
