import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Star,
  ChevronRight,
  Wand2,
  Gauge,
  Target,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  Lock,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

/* ============================================================
   START-IT — Visual Identity V3 — "Topstitch"
   Not fashion-atelier-cream, not SaaS-dark-mode-teal. Grounded in
   the actual material: raw denim base, gold topstitching as the
   signature line (the double-row stitch on a jean seam — used for
   the scroll spine, card borders, dividers), copper marking the
   one thing that's locked (Investors). One accent, one job each.

   Set window.__STARTIT_API_BASE__ to your deployed backend URL to
   flip every tool card from demo mode to hitting the real API —
   no other code changes needed.
   ============================================================ */

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  button, a, input, textarea { touch-action: manipulation; } /* kills the ~300ms tap-delay some mobile browsers still apply, which reads as "hanging" on a first tap */
`;

const DENIM = "#171A21";
const CHALK = "#F1EAD9";
const GOLD = "#C99A2E";
const COPPER = "#B0693D";

const PATHS = [
  { id: "new", label: "A new business", sub: "Just an idea so far", icon: Sparkles },
  { id: "scale", label: "Ready to scale", sub: "Already running, needs reach", icon: TrendingUp },
  { id: "influencer", label: "A public figure", sub: "Building an audience", icon: Star },
  { id: "learn", label: "Learn a skill", sub: "Train, then earn on the marketplace", icon: Users },
];

class ToolError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

const TOOLS = [
  {
    id: "name-tagline",
    label: "Name & Tagline",
    icon: Wand2,
    prompt: "Describe your idea in a sentence",
    placeholder: "A delivery app for home-cooked meals in Lagos",
    minLen: 5,
    buildPayload: (input) => ({ idea: input }),
    demo: (input) => ({
      names: [`${cap(firstWord(input))}ly`, "Chop&Go", "TableTurn"],
      tagline: "Home-cooked, delivered like it means something.",
    }),
  },
  {
    id: "readiness-score",
    label: "Readiness Score",
    icon: Gauge,
    prompt: "One line on where your business stands today",
    placeholder: "Registered with CAC, no website yet, 12 customers by word of mouth",
    minLen: 10,
    buildPayload: (input) => ({ answers: { summary: input } }),
    demo: () => ({
      score: 61,
      strengths: ["Real paying customers already", "Legally registered"],
      gaps: ["No web presence", "No repeatable acquisition channel"],
    }),
  },
  {
    id: "pain-point-finder",
    label: "Pain Point Finder",
    icon: Target,
    prompt: "Describe your ideal customer",
    placeholder: "Busy young professionals in Lekki who hate cooking after work",
    minLen: 10,
    buildPayload: (input) => ({ customerDescription: input }),
    demo: () => ({
      pain_points: [
        { point: "No time to cook after a long commute", why_it_matters: "Directly drives delivery/subscription demand" },
        { point: "Tired of the same 3 delivery options", why_it_matters: "Room to win on variety, not just speed" },
      ],
    }),
  },
  {
    id: "legal-check",
    label: "Legal Check",
    icon: ShieldCheck,
    prompt: "Paste a clause you're unsure about",
    placeholder: "This agreement automatically renews unless cancelled 90 days in advance...",
    minLen: 15,
    buildPayload: (input) => ({ documentText: input }),
    demo: () => ({
      overall_risk: "medium",
      flags: [{ risk: "medium", explanation: "Auto-renewal with a long cancellation window can lock you in longer than expected." }],
    }),
  },
];

function firstWord(s) {
  return (s || "").trim().split(/\s+/)[0] || "Venture";
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function getApiBase() {
  return typeof window !== "undefined" ? window.__STARTIT_API_BASE__ || null : null;
}

/* ---------- Topstitch: the signature line — a scroll spine + section dividers ---------- */
function StitchLine({ vertical, progress = 1 }) {
  const dash = "6 5";
  if (vertical) {
    return (
      <div className="fixed left-0 top-0 h-full w-[6px] z-40 flex gap-[2px]">
        {[0, 1].map((i) => (
          <svg key={i} width="2" height="100%" className="h-full">
            <line x1="1" y1="0" x2="1" y2={`${progress * 100}%`} stroke={GOLD} strokeWidth="2" strokeDasharray={dash} opacity="0.85" />
          </svg>
        ))}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 400 8" className="w-full h-2" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="2" x2="400" y2="2" stroke={GOLD} strokeWidth="1.5" strokeDasharray="7 5" opacity="0.9" />
      <line x1="0" y1="6" x2="400" y2="6" stroke={GOLD} strokeWidth="1.5" strokeDasharray="7 5" opacity="0.45" />
    </svg>
  );
}

function SectionLabel({ index, children }) {
  return (
    <p className="text-[12px] font-mono uppercase tracking-[0.18em] mb-3" style={{ color: `${CHALK}66` }}>
      <span style={{ color: GOLD }}>{index}</span> &nbsp;{children}
    </p>
  );
}

/* ---------- Tool card: real dual-mode fetch, with actual load/error states ---------- */
function ToolCard({ tool }) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationMsg, setValidationMsg] = useState(null);
  const Icon = tool.icon;

  const run = useCallback(async () => {
    if (input.trim().length < tool.minLen) {
      setValidationMsg(`Give me at least ${tool.minLen} characters — a fragment won't score well.`);
      return;
    }
    setValidationMsg(null);
    setStatus("loading");
    setError(null);

    const apiBase = getApiBase();

    try {
      if (apiBase) {
        const controller = new AbortController();
        // 30s budget — must stay ahead of the server's own worst-case chain
        // timeout (3 providers x 8s = 24s, see modelRouter.js). If you change
        // one, change the other, or you'll get a client-side "timed out"
        // error while the server is still legitimately working.
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        let res;
        try {
          res = await fetch(`${apiBase}/api/tools/${tool.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tool.buildPayload(input)),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (res.status === 429) throw new ToolError("rate_limited", "Getting a lot of traffic right now — give it 30 seconds and try again.");
        if (res.status === 502) throw new ToolError("provider_down", "All our AI providers are busy at once — rare, but it happens on free tiers. Try again shortly.");
        if (res.status >= 500) throw new ToolError("server", "Something broke on our end. We've logged it — try again in a moment.");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new ToolError("validation", body.error || "That input didn't pass a check on our side.");
        }
        const data = await res.json();
        setResult(data);
        setStatus("done");
      } else {
        // Demo mode: no backend URL set yet. Same shape as the real response.
        await new Promise((resolve) => setTimeout(resolve, 900));
        setResult(tool.demo(input));
        setStatus("done");
      }
    } catch (e) {
      if (e.name === "AbortError") {
        setError({ message: "Took too long to respond — free-tier providers can be slow under load. Try again." });
      } else if (e instanceof ToolError) {
        setError({ message: e.message });
      } else {
        setError({ message: "Couldn't reach the server. Check your connection and try again." });
      }
      setStatus("error");
    }
  }, [input, tool]);

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4 relative"
      style={{ background: `${CHALK}06`, border: `1.5px dashed ${CHALK}2e` }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ borderColor: GOLD, color: GOLD }}>
          <Icon className="h-4 w-4" />
        </span>
        <p style={{ fontFamily: "'Big Shoulders Display', sans-serif" }} className="text-[19px] font-bold uppercase tracking-wide">
          {tool.label}
        </p>
      </div>

      <label className="text-[12px]" style={{ color: `${CHALK}80` }}>
        {tool.prompt}
      </label>
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (validationMsg) setValidationMsg(null);
        }}
        placeholder={tool.placeholder}
        rows={2}
        className="w-full rounded-md bg-transparent border px-3 py-2 text-[13px] outline-none resize-none"
        style={{ borderColor: validationMsg ? "#D64545" : `${CHALK}2a`, color: CHALK }}
        onFocus={(e) => (e.target.style.borderColor = GOLD)}
        onBlur={(e) => (e.target.style.borderColor = validationMsg ? "#D64545" : `${CHALK}2a`)}
      />
      {validationMsg && (
        <p className="text-[12px] flex items-center gap-1.5 -mt-2" style={{ color: "#E38080" }}>
          <AlertTriangle className="h-3 w-3 shrink-0" /> {validationMsg}
        </p>
      )}

      <button
        onClick={run}
        disabled={status === "loading" || !input.trim()}
        className="self-start flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide rounded-full px-4 py-2 transition-colors duration-200 disabled:opacity-40"
        style={{ background: status === "loading" ? "transparent" : GOLD, color: status === "loading" ? CHALK : DENIM, border: `2px solid ${GOLD}` }}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
          </>
        ) : status === "error" ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </>
        ) : (
          <>
            Try it free <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {status === "error" && error && (
        <div className="rounded-md px-4 py-3 text-[12.5px] leading-relaxed flex items-start gap-2" style={{ background: "#D6454518", color: "#E9A0A0", border: "1px solid #D6454540" }}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error.message}
        </div>
      )}

      {status === "done" && result && (
        <div className="rounded-md px-4 py-3 text-[12.5px] leading-relaxed font-mono" style={{ background: `${GOLD}12`, color: `${CHALK}CC` }}>
          {tool.id === "name-tagline" && (
            <>
              <span style={{ color: GOLD }}>names:</span> {result.names.join(" · ")}
              <br />
              <span style={{ color: GOLD }}>tagline:</span> "{result.tagline}"
            </>
          )}
          {tool.id === "readiness-score" && (
            <>
              <span style={{ color: GOLD }}>score:</span> {result.score}/100
              <br />
              <span style={{ color: GOLD }}>strength:</span> {result.strengths[0]}
              <br />
              <span style={{ color: GOLD }}>gap:</span> {result.gaps[0]}
            </>
          )}
          {tool.id === "pain-point-finder" && (
            <>
              {result.pain_points.map((p, i) => (
                <div key={i} className="mb-1">
                  <span style={{ color: GOLD }}>{i + 1}.</span> {p.point}
                </div>
              ))}
            </>
          )}
          {tool.id === "legal-check" && (
            <>
              <span style={{ color: COPPER }}>risk: {result.overall_risk}</span>
              <br />
              {result.flags[0].explanation}
            </>
          )}
          {!getApiBase() && (
            <p className="mt-2 text-[10px]" style={{ color: `${CHALK}55` }}>
              demo preview — set window.__STARTIT_API_BASE__ to hit the real tool
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Contact ---------- */
function ContactRow({ email }) {
  const [state, setState] = useState("idle"); // idle | copied | unsupported
  const hiddenInputRef = useRef(null);

  const legacyCopy = () => {
    // navigator.clipboard needs a secure context (HTTPS) and isn't on
    // every older mobile browser. execCommand is deprecated but still
    // works everywhere navigator.clipboard doesn't — real fallback,
    // not just a different error message.
    const el = hiddenInputRef.current;
    if (!el) return false;
    el.value = email;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, email.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(el);
    return ok;
  };

  const copy = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(email);
        setState("copied");
        setTimeout(() => setState("idle"), 1800);
        return;
      } catch {
        // fall through to legacy path below
      }
    }
    const ok = legacyCopy();
    setState(ok ? "copied" : "unsupported");
    setTimeout(() => setState("idle"), ok ? 1800 : 2400);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-md px-5 py-4" style={{ border: `1.5px dashed ${CHALK}2a` }}>
      <input ref={hiddenInputRef} type="text" readOnly className="sr-only" aria-hidden="true" tabIndex={-1} />
      <a href={`mailto:${email}`} className="flex items-center gap-3 text-[14px] hover:underline" style={{ color: CHALK }}>
        <Mail className="h-4 w-4" style={{ color: GOLD }} />
        {email}
      </a>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 text-[12px] font-mono rounded-full px-3 py-1.5 border transition-colors duration-200"
        style={{ borderColor: state === "copied" ? GOLD : `${CHALK}25`, color: state === "copied" ? GOLD : `${CHALK}80` }}
      >
        {state === "copied" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {state === "copied" ? "copied" : state === "unsupported" ? "long-press to copy" : "copy"}
      </button>
    </div>
  );
}

/* ---------- Investors — coming soon ---------- */
function InvestorsPanel() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [formError, setFormError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("That doesn't look like a full email address.");
      return;
    }
    setFormError(null);
    // Stub: no backend table for this yet — add an investors_waitlist table
    // (same RLS pattern as schema.sql) and POST here once it exists.
    setJoined(true);
  };

  return (
    <div className="rounded-xl p-8 sm:p-10 relative overflow-hidden" style={{ border: `2px solid ${COPPER}55`, background: `${COPPER}0a` }}>
      <div className="absolute top-0 right-0 px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider" style={{ background: COPPER, color: DENIM }}>
        Coming soon
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 mb-5" style={{ borderColor: COPPER, color: COPPER }}>
        <Lock className="h-4 w-4" />
      </span>
      <h3 style={{ fontFamily: "'Big Shoulders Display', sans-serif" }} className="text-[28px] font-bold uppercase tracking-wide mb-3">
        Investor Match
      </h3>
      <p className="text-[14px] leading-relaxed max-w-md mb-6" style={{ color: `${CHALK}90` }}>
        The other side of the marketplace: founders who hit readiness milestones get surfaced to investors looking for exactly that stage and sector. Not open yet — get on the list, we'll email you the day it is.
      </p>
      {joined ? (
        <p className="text-[13px] font-mono" style={{ color: COPPER }}>
          ✓ you're on the list — we'll reach out at {email}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2 max-w-md">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="you@company.com"
              className="flex-1 rounded-full bg-transparent border px-4 py-2.5 text-[13px] outline-none"
              style={{ borderColor: formError ? "#D64545" : `${CHALK}2a`, color: CHALK }}
            />
            <button type="submit" className="rounded-full px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide" style={{ background: COPPER, color: DENIM }}>
              Notify me
            </button>
          </div>
          {formError && (
            <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#E38080" }}>
              <AlertTriangle className="h-3 w-3 shrink-0" /> {formError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function StartItLanding({ onStart } = {}) {
  const [hovered, setHovered] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [spineProgress, setSpineProgress] = useState(0);

  const toolsRef = useRef(null);
  const marketplaceRef = useRef(null);
  const investorsRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = pageRef.current;
      if (!el) return;
      const max = el.scrollHeight - window.innerHeight;
      setSpineProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div ref={pageRef} style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen relative">
      <style>{FONTS}</style>
      <div className="fixed inset-0 -z-10" style={{ background: DENIM }} />
      <StitchLine vertical progress={spineProgress} />

      <div style={{ color: CHALK }}>
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto">
          <span style={{ fontFamily: "'Big Shoulders Display', sans-serif" }} className="text-2xl font-extrabold uppercase tracking-tight">
            Start-It
          </span>
          <nav className="hidden sm:flex items-center gap-8 text-sm" style={{ color: `${CHALK}99` }}>
            <button onClick={() => scrollTo(toolsRef)} className="hover:text-white transition-colors">Tools</button>
            <button onClick={() => scrollTo(marketplaceRef)} className="hover:text-white transition-colors">Marketplace</button>
            <button onClick={() => scrollTo(investorsRef)} className="hover:text-white transition-colors">Investors</button>
          </nav>
          <button
            onClick={() => onStart?.(selectedPath)}
            className="text-sm font-semibold uppercase tracking-wide rounded-full px-4 py-1.5 transition-colors duration-300"
            style={{ background: GOLD, color: DENIM }}
          >
            Start free
          </button>
        </header>

        {/* Hero — hook fast, no throat-clearing */}
        <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-8 sm:pt-14 pb-24">
          <div className={`max-w-2xl transition-all duration-500 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-wide mb-6" style={{ color: `${CHALK}70` }}>
              <span style={{ color: GOLD }}>●</span> 4 tools · 0 signup · under 60 seconds
            </div>
            <h1
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              className="text-[3rem] sm:text-[4.5rem] leading-[0.95] font-extrabold uppercase tracking-tight mb-6"
            >
              Stop guessing.
              <br />
              <span style={{ color: GOLD }}>Get fitted.</span>
            </h1>
            <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-lg" style={{ color: `${CHALK}A6` }}>
              Start-It measures your idea — market, voice, ambition — and cuts a brand to fit it. Not a template pack. Try the tools below before you sign up for anything.
            </p>
          </div>

          <div className="mt-12 mb-3">
            <StitchLine />
          </div>
          <p className="text-[12px] mb-8 font-mono" style={{ color: `${CHALK}66` }}>
            {selectedPath
              ? `Marked — ${PATHS.find((p) => p.id === selectedPath)?.label}. Scroll down, the tools are live.`
              : hovered
              ? `Measuring — ${PATHS.find((p) => p.id === hovered)?.label}`
              : "Where are you starting from"}
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {PATHS.map((path, i) => {
              const Icon = path.icon;
              const isHovered = hovered === path.id;
              const isSelected = selectedPath === path.id;
              return (
                <button
                  key={path.id}
                  onMouseEnter={() => setHovered(path.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    setSelectedPath(path.id);
                    scrollTo(toolsRef);
                  }}
                  className="group relative flex items-center justify-between text-left rounded-md px-6 py-5 transition-all duration-300"
                  style={{
                    border: `1.5px dashed ${isSelected ? GOLD : isHovered ? `${GOLD}99` : `${CHALK}20`}`,
                    background: isSelected ? `${GOLD}10` : isHovered ? `${GOLD}08` : `${CHALK}05`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300"
                      style={{ borderColor: isSelected || isHovered ? GOLD : `${CHALK}26`, color: isSelected || isHovered ? GOLD : `${CHALK}80` }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p style={{ fontFamily: "'Big Shoulders Display', sans-serif" }} className="text-[17px] font-bold uppercase tracking-wide">
                        {path.label}
                      </p>
                      <p className="text-[13px] mt-0.5" style={{ color: `${CHALK}73` }}>{path.sub}</p>
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-all duration-300"
                    style={{ color: GOLD, opacity: isSelected || isHovered ? 1 : 0, transform: isSelected || isHovered ? "translateX(0)" : "translateX(-4px)" }}
                  />
                </button>
              );
            })}
          </div>
        </main>

        {/* Tools */}
        <section ref={toolsRef} className="max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t" style={{ borderColor: `${CHALK}15`, borderStyle: "dashed" }}>
          <SectionLabel index="01">No signup. No card. Try them now</SectionLabel>
          <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif" }} className="text-[2.25rem] sm:text-[2.75rem] font-extrabold uppercase tracking-tight mb-10 max-w-xl">
            The fitting room.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* Marketplace */}
        <section ref={marketplaceRef} className="max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t" style={{ borderColor: `${CHALK}15`, borderStyle: "dashed" }}>
          <SectionLabel index="02">The flywheel</SectionLabel>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md px-6 py-6" style={{ border: `1.5px dashed ${CHALK}20`, background: `${CHALK}05` }}>
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "#3F6B4D33", color: "#7BB68C" }}>
                <Users className="h-4 w-4" />
              </span>
              <p className="text-[14px] leading-snug max-w-md" style={{ color: `${CHALK}B3` }}>
                Every brand manager, designer, and SMM on Start-It trained here first. <span style={{ color: CHALK }}>Learn a skill, get matched to real clients.</span>
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide whitespace-nowrap group" style={{ color: GOLD }}>
              See the marketplace
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>

        {/* Investors — coming soon */}
        <section ref={investorsRef} className="max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t" style={{ borderColor: `${CHALK}15`, borderStyle: "dashed" }}>
          <SectionLabel index="03">For the other side of the table</SectionLabel>
          <InvestorsPanel />
        </section>

        {/* Contact */}
        <section className="max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t" style={{ borderColor: `${CHALK}15`, borderStyle: "dashed" }}>
          <SectionLabel index="04">Talk to us</SectionLabel>
          <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif" }} className="text-[2rem] font-extrabold uppercase tracking-tight mb-8 max-w-xl">
            Questions. Partnerships. Press.
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            <ContactRow email="ebunhunsu1@gmail.com" />
            <ContactRow email="isabelgarpiya@gmail.com" />
          </div>
        </section>

        <footer className="max-w-6xl mx-auto px-6 sm:px-10 pb-10">
          <div className="h-px mb-6" style={{ background: `${CHALK}15` }} />
          <p className="text-[12px] font-mono" style={{ color: `${CHALK}4d` }}>Start-It · Lagos</p>
        </footer>
      </div>
    </div>
  );
}
