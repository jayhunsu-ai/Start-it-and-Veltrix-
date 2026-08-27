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

export default function App() {
  // "checking" avoids a flash of the landing/signup page for a
  // returning user who already has a valid Supabase session — we
  // don't know which view to show until the session check resolves.
  const [view, setView] = useState("checking");
  const [initialSegment, setInitialSegment] = useState(null);
  const [initialMode, setInitialMode] = useState("signup");
  const [material, setMaterial] = useState("denim");

  // Resume state for a returning, already-authenticated user — set
  // once by the session check below, then handed to StartItDemo so
  // it can boot straight into the dashboard (or back into onboarding
  // exactly where they left off) instead of the welcome/signup step.
  const [resume, setResume] = useState(null); // { step, authUserId, profile } | null

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      if (!authConfigured) {
        if (!cancelled) setView("landing");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) setView("landing");
        return;
      }

      // Valid session exists — this is a returning user. Never send
      // them back through welcome/signup: pull their profile and
      // resume exactly where onboarding left off, or straight to the
      // dashboard if it's already complete.
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;

      setResume({
        step: profile?.segment ? STEP_DASHBOARD : STEP_SEGMENT,
        authUserId: session.user.id,
        profile: profile || null,
      });
      setView("app");
    }

    checkExistingSession();

    // If the session is cleared elsewhere (sign-out, expired refresh
    // token with no valid grant left), fall back to landing instead
    // of leaving the user stuck on a dashboard with no session.
    let subscription;
    if (authConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          setResume(null);
          setView("landing");
        }
      });
      subscription = data.subscription;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  if (view === "checking") {
    // Deliberately minimal — this should resolve in well under a
    // second against Supabase's local session cache, so a full
    // loading screen would just be flicker.
    return <div className="startit-workshop-app" data-material={material} />;
  }

  const content =
    view === "app" ? (
      <StartItDemo
        initialSegment={initialSegment}
        initialMode={initialMode}
        initialStep={resume?.step}
        initialAuthUserId={resume?.authUserId}
        initialProfile={resume?.profile}
        onExit={() => { setResume(null); setView("landing"); }}
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
