import { useState, useEffect } from "react";
import StartItLanding from "./start-it-landing.jsx";
import StartItDemo from "./start-it-demo.jsx";
import WorkshopChrome from "./WorkshopChrome.jsx";
import WorkshopLab from "./WorkshopLab.jsx";
import { supabase, authConfigured } from "./lib/supabaseClient.js";
import "./phase2.css";

// Mirrors the STEPS array in start-it-demo.jsx (dashboard = index 9,
// segment-picker = index 2). Kept in sync manually since App.jsx
// shouldn't need to import the whole demo module's internals just
// for two integers.
const STEP_SEGMENT = 2;
const STEP_DASHBOARD = 9;

// Supabase should never be able to hold the entire app hostage.
// These are intentionally short because the landing page is usable
// without waiting for auth hydration.
const SESSION_TIMEOUT_MS = 5000;
const PROFILE_TIMEOUT_MS = 5000;

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export default function App() {
  // Render the landing page immediately. Authentication is hydrated
  // in the background so a slow mobile connection, blocked request,
  // stale refresh token, or Supabase outage cannot produce a blank
  // screen indefinitely.
  const [view, setView] = useState("landing");
  const [initialSegment, setInitialSegment] = useState(null);
  const [initialMode, setInitialMode] = useState("signup");
  const [material, setMaterial] = useState("denim");

  // Resume state for a returning, already-authenticated user.
  const [resume, setResume] = useState(null); // { step, authUserId, profile } | null

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      if (!authConfigured) {
        return;
      }

      try {
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          { data: { session: null }, error: new Error("Session check timed out") }
        );

        if (cancelled) return;

        const session = sessionResult?.data?.session;

        // No session, an auth error, or a timeout: keep the landing page.
        if (!session?.user) {
          return;
        }

        // We have a session. Move into the app immediately rather than
        // making the profile query a second blocking gate.
        setResume({
          step: STEP_SEGMENT,
          authUserId: session.user.id,
          profile: null,
        });
        setView("app");

        // Hydrate the profile in the background. If it fails or times out,
        // the app still remains usable; StartItDemo can operate from the
        // authenticated user ID.
        const profileResult = await withTimeout(
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single(),
          PROFILE_TIMEOUT_MS,
          { data: null, error: new Error("Profile lookup timed out") }
        );

        if (cancelled) return;

        const profile = profileResult?.data || null;

        setResume({
          step: profile?.segment ? STEP_DASHBOARD : STEP_SEGMENT,
          authUserId: session.user.id,
          profile,
        });
      } catch (error) {
        // Authentication is an enhancement to the initial render, not
        // a reason to brick the app. Keep the public landing page usable.
        console.warn("[Start-it] Auth hydration failed:", error);
      }
    }

    checkExistingSession();

    // Keep the UI responsive to explicit sign-out events.
    let subscription;
    if (authConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT") {
            setResume(null);
            setView("landing");
          }
        });
        subscription = data?.subscription;
      } catch (error) {
        console.warn("[Start-it] Auth listener setup failed:", error);
      }
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const content =
    view === "app" ? (
      <StartItDemo
        initialSegment={initialSegment}
        initialMode={initialMode}
        initialStep={resume?.step}
        initialAuthUserId={resume?.authUserId}
        initialProfile={resume?.profile}
        onExit={() => {
          setResume(null);
          setView("landing");
        }}
      />
    ) : (
      <StartItLanding
        onStart={(segmentId) => {
          setInitialSegment(segmentId || null);
          setInitialMode("signup");
          setView("app");
        }}
        onLogIn={() => {
          setInitialMode("login");
          setView("app");
        }}
      />
    );

  return (
    <div className="startit-workshop-app" data-material={material}>
      <WorkshopChrome />
      <WorkshopLab mode={material} onModeChange={setMaterial} />
      <div className="startit-workshop-content">{content}</div>
    </div>
  );
}
