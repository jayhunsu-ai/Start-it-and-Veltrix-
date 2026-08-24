import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Sparkles, Users, TrendingUp, Star, ChevronRight } from "lucide-react";

/* ============================================================
   START-IT — Visual Identity V1
   Signature: "The Fitting" — a teal-blue thread-line that draws itself,
   like a tailor's chalk marking a measurement. Literal expression
   of "getting the image you deserve."
   ============================================================ */

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`;

const PATHS = [
  {
    id: "new",
    label: "A new business",
    sub: "Just an idea so far",
    icon: Sparkles,
  },
  {
    id: "scale",
    label: "Ready to scale",
    sub: "Already running, needs reach",
    icon: TrendingUp,
  },
  {
    id: "influencer",
    label: "A public figure",
    sub: "Building an audience",
    icon: Star,
  },
  {
    id: "learn",
    label: "Learn a skill",
    sub: "Train, then earn on the marketplace",
    icon: Users,
  },
];

function ThreadLine({ progress }) {
  return (
    <svg
      viewBox="0 0 400 4"
      className="w-full h-1"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="2" x2="400" y2="2" stroke="#3A3324" strokeWidth="1" opacity="0.15" />
      <line
        x1="0"
        y1="2"
        x2={400 * progress}
        y2="2"
        stroke="#1CB5C9"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: "x2 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </svg>
  );
}

export default function StartItHero() {
  const [hovered, setHovered] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [threadProgress, setThreadProgress] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setThreadProgress(1), 150);
    return () => clearTimeout(t);
  }, []);

  const activeIndex = hovered !== null ? PATHS.findIndex((p) => p.id === hovered) : -1;
  const targetProgress = activeIndex >= 0 ? (activeIndex + 1) / PATHS.length : 1;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#12182B] text-[#F7F3EC]">
      <style>{FONTS}</style>

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto">
        <span
          style={{ fontFamily: "'Fraunces', serif" }}
          className="text-xl font-medium tracking-tight"
        >
          Start-It
        </span>
        <nav className="hidden sm:flex items-center gap-8 text-sm text-[#F7F3EC]/60">
          <span>How it works</span>
          <span>Marketplace</span>
          <span>Pricing</span>
        </nav>
        <button className="text-sm font-medium border border-[#F7F3EC]/20 rounded-full px-4 py-1.5 hover:border-[#1CB5C9] hover:text-[#1CB5C9] transition-colors duration-300">
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-10 sm:pt-16 pb-24">
        <div
          className={`max-w-2xl transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#1CB5C9] mb-5 font-medium">
            Brand strategy, fitted to you
          </p>
          <h1
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-[2.75rem] sm:text-[4rem] leading-[1.02] font-medium tracking-tight mb-6"
          >
            Getting the image
            <br />
            you deserve.
          </h1>
          <p className="text-[17px] sm:text-lg text-[#F7F3EC]/65 leading-relaxed max-w-lg">
            Not a template. Not a generic logo pack. Start-It takes your
            measurements — your market, your voice, your ambition — and
            builds a brand that actually fits.
          </p>
        </div>

        {/* The Fitting — signature thread element */}
        <div className="mt-14 mb-3">
          <ThreadLine progress={mounted ? threadProgress : 0} />
        </div>
        <p className="text-[12px] text-[#F7F3EC]/40 mb-8 font-mono">
          {hovered ? `Measuring — ${PATHS.find((p) => p.id === hovered)?.label}` : "Choose where you're starting from"}
        </p>

        {/* Path cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {PATHS.map((path, i) => {
            const Icon = path.icon;
            const isHovered = hovered === path.id;
            return (
              <button
                key={path.id}
                onMouseEnter={() => setHovered(path.id)}
                onMouseLeave={() => setHovered(null)}
                className={`group relative flex items-center justify-between text-left rounded-2xl border px-6 py-5 transition-all duration-300 ${
                  isHovered
                    ? "border-[#1CB5C9]/60 bg-[#1CB5C9]/[0.06]"
                    : "border-[#F7F3EC]/10 bg-[#F7F3EC]/[0.02]"
                }`}
                style={{
                  transitionDelay: mounted ? `${i * 60}ms` : "0ms",
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      isHovered ? "border-[#1CB5C9] text-[#1CB5C9]" : "border-[#F7F3EC]/15 text-[#F7F3EC]/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p
                      style={{ fontFamily: "'Fraunces', serif" }}
                      className="text-[17px] font-medium"
                    >
                      {path.label}
                    </p>
                    <p className="text-[13px] text-[#F7F3EC]/45 mt-0.5">{path.sub}</p>
                  </div>
                </div>
                <ArrowRight
                  className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                    isHovered ? "translate-x-0 opacity-100 text-[#1CB5C9]" : "-translate-x-1 opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Marketplace strip — the flywheel, stated plainly */}
        <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#F7F3EC]/10 bg-[#F7F3EC]/[0.02] px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1F6F65]/20 text-[#4FA89A]">
              <Users className="h-4 w-4" />
            </span>
            <p className="text-[14px] text-[#F7F3EC]/70 leading-snug max-w-md">
              Every brand manager, designer, and social media manager on
              Start-It trained here first.{" "}
              <span className="text-[#F7F3EC]">Learn a skill, then get matched to real clients.</span>
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#1CB5C9] whitespace-nowrap group">
            See the marketplace
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 sm:px-10 pb-10">
        <div className="h-px bg-[#F7F3EC]/10 mb-6" />
        <p className="text-[12px] font-mono text-[#F7F3EC]/30">Start-It · Lagos</p>
      </footer>
    </div>
  );
}
