/**
 * lib/supabase.js
 *
 * Exports a single `db` client (or null if env vars aren't set yet).
 * Every route that uses db already does a `if (db && ...)` guard, so
 * the server starts and the AI tools work even before Supabase is wired —
 * only the write paths (brand_snapshots, extras_orders) are skipped.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY — this file is backend-only.
 * It must never be imported by any frontend code / browser bundle.
 */

const { createClient } = require("@supabase/supabase-js");

const url  = process.env.SUPABASE_URL;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

let db = null;

if (url && key) {
  db = createClient(url, key, {
    auth: {
      // Service role key bypasses RLS — that's intentional for server-side
      // writes. RLS still protects client-facing queries via the anon key.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log("Supabase connected.");
} else {
  console.warn(
    "Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing). " +
    "DB-backed features will be skipped until keys are set."
  );
}

module.exports = { db };
