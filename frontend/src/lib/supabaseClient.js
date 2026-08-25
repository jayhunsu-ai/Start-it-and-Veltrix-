import { createClient } from "@supabase/supabase-js";

/**
 * lib/supabaseClient.js
 *
 * Frontend-only Supabase client, built with the public anon key (never
 * the service role key — that one stays server-side in server/lib/supabase.js).
 * The anon key is safe to ship in the browser bundle: every table has
 * RLS on ("own profile", "own letters", etc.), so the anon key alone
 * can only ever touch rows that belong to the signed-in user.
 *
 * This is what makes signup/login real instead of the old "just store
 * a name in local state" placeholder — auth.signUp/signInWithPassword
 * create an actual auth.users row, which is what profiles.id and every
 * user_id foreign key downstream (extras_orders, future_letters, ...)
 * needs to exist before those writes stop failing.
 */

const url = import.meta.env.VITE_SUPABASE_URL || null;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const authConfigured = !!supabase;
