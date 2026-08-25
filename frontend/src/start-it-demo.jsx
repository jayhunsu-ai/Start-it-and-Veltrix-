import React, { useState, useEffect, useMemo } from "react";
import { useToolCall } from "./lib/useToolCall.js";
import {
  Globe2, Gauge, Target, Layout, Rocket, Check, ChevronRight,
  Package, Palette, Users, Share2, FileBadge2, Wand2, Rows3,
  TrendingUp, Star, Instagram, MessageCircle, Music2, Link2, ArrowUpRight,
  Loader2, AlertTriangle, RotateCcw, X
} from "lucide-react";

/* ---------- Segment-aware content ---------- */

const SEGMENTS = [
  {
    id: "new",
    label: "A new business",
    sub: "Just an idea so far — nothing built yet",
    icon: Wand2,
  },
  {
    id: "scale",
    label: "An existing business, ready to scale",
    sub: "Already running — needs structure and reach",
    icon: TrendingUp,
  },
  {
    id: "influencer",
    label: "A public figure or influencer",
    sub: "Building a personal brand and audience",
    icon: Star,
  },
  {
    id: "learn",
    label: "Learn a skill",
    sub: "Train, then earn on the marketplace",
    icon: Users,
  },
];

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "signup", label: "Sign up" },
  { key: "segment", label: "Who you are" },
  { key: "language", label: "Language" },
  { key: "tools", label: "Free tools" },
  { key: "tier", label: "Choose tier" },
  { key: "tierWelcome", label: "Tier unlocked" },
  { key: "extras", label: "Extras" },
  { key: "golive", label: "Go live" },
  { key: "dashboard", label: "Dashboard" },
];

const LANGUAGES = ["English", "Français", "Português", "العربية", "Kiswahili", "Hausa", "Yorùbá", "Igbo"];

const TIERS_BY_SEGMENT = {
  new: [
    { id: "foundation", name: "Foundation", price: 22000, tagline: "Find your footing", features: ["Brand strategy development", "Business identity design", "Community access"] },
    { id: "growth", name: "Growth", price: 38000, tagline: "Build your visibility", features: ["Everything in Foundation", "Content positioning", "Priority community support"], recommended: true },
    { id: "visibility", name: "Visibility", price: 65000, tagline: "Own the room", features: ["Everything in Growth", "Dedicated brand manager", "Public-facing positioning"] },
  ],
  scale: [
    { id: "foundation", name: "Foundation", price: 22000, tagline: "Tighten what you have", features: ["Brand & offer audit", "Identity refresh", "Community access"] },
    { id: "growth", name: "Growth", price: 38000, tagline: "Grow with structure", features: ["Everything in Foundation", "Content & channel strategy", "Priority community support"], recommended: true },
    { id: "visibility", name: "Visibility", price: 65000, tagline: "Scale with a team behind you", features: ["Everything in Growth", "Dedicated brand manager", "Multi-channel expansion plan"] },
  ],
  influencer: [
    { id: "foundation", name: "Foundation", price: 22000, tagline: "Define your brand", features: ["Personal brand strategy", "Visual identity & handle kit", "Community access"] },
    { id: "growth", name: "Growth", price: 38000, tagline: "Grow your audience", features: ["Everything in Foundation", "Content pillar & calendar", "Priority community support"], recommended: true },
    { id: "visibility", name: "Visibility", price: 65000, tagline: "Brand-deal ready", features: ["Everything in Growth", "Dedicated brand manager", "Media kit & rate card"] },
  ],
  learn: [
    { id: "foundation", name: "Foundation", price: 0, tagline: "Start the track", features: ["Full skill track access", "Portfolio brief templates", "Community access"] },
    { id: "growth", name: "Growth", price: 12000, tagline: "Get certified", features: ["Everything in Foundation", "1:1 mentor review", "Certification on completion"], recommended: true },
    { id: "visibility", name: "Visibility", price: 20000, tagline: "Get matched", features: ["Everything in Growth", "Priority marketplace placement", "First client match guaranteed"] },
  ],
};

const TIER_UNLOCKS = {
  new: {
    foundation: [{ title: "Brand strategy session", detail: "Booked for this week — positioning, audience, pricing logic." }, { title: "Identity mood board", detail: "Three visual directions ready for your review." }],
    growth: [{ title: "Brand strategy session", detail: "Booked for this week — positioning, audience, pricing logic." }, { title: "Identity mood board", detail: "Three visual directions ready for your review." }, { title: "Content positioning brief", detail: "Your first 2 weeks of captions, drafted in your voice." }],
    visibility: [{ title: "Brand strategy session", detail: "Booked for this week — positioning, audience, pricing logic." }, { title: "Identity mood board", detail: "Three visual directions ready for your review." }, { title: "Content positioning brief", detail: "Your first 2 weeks of captions, drafted in your voice." }, { title: "Dedicated brand manager", detail: "Meet Chidinma — your point of contact from today." }],
  },
  scale: {
    foundation: [{ title: "Brand & offer audit", detail: "Gaps in your current pricing and positioning flagged." }, { title: "Identity refresh", detail: "Updated visuals drafted from what you already have." }],
    growth: [{ title: "Brand & offer audit", detail: "Gaps in your current pricing and positioning flagged." }, { title: "Identity refresh", detail: "Updated visuals drafted from what you already have." }, { title: "Channel strategy", detail: "Where to focus next — drafted from your current reach." }],
    visibility: [{ title: "Brand & offer audit", detail: "Gaps in your current pricing and positioning flagged." }, { title: "Identity refresh", detail: "Updated visuals drafted from what you already have." }, { title: "Channel strategy", detail: "Where to focus next — drafted from your current reach." }, { title: "Dedicated brand manager", detail: "Meet Chidinma — your point of contact from today." }],
  },
  influencer: {
    foundation: [{ title: "Personal brand session", detail: "Booked for this week — niche, voice, positioning." }, { title: "Handle & visual kit", detail: "Three identity directions ready for your review." }],
    growth: [{ title: "Personal brand session", detail: "Booked for this week — niche, voice, positioning." }, { title: "Handle & visual kit", detail: "Three identity directions ready for your review." }, { title: "Content pillar plan", detail: "Your first 2 weeks of content angles, mapped out." }],
    visibility: [{ title: "Personal brand session", detail: "Booked for this week — niche, voice, positioning." }, { title: "Handle & visual kit", detail: "Three identity directions ready for your review." }, { title: "Content pillar plan", detail: "Your first 2 weeks of content angles, mapped out." }, { title: "Dedicated brand manager", detail: "Meet Chidinma — your point of contact from today." }],
  },
  learn: {
    foundation: [{ title: "Skill track access", detail: "Full curriculum unlocked — start today." }, { title: "Portfolio brief templates", detail: "Real client-style briefs to practice against." }],
    growth: [{ title: "Skill track access", detail: "Full curriculum unlocked — start today." }, { title: "Portfolio brief templates", detail: "Real client-style briefs to practice against." }, { title: "1:1 mentor review", detail: "Feedback from a certified marketplace pro." }],
    visibility: [{ title: "Skill track access", detail: "Full curriculum unlocked — start today." }, { title: "Portfolio brief templates", detail: "Real client-style briefs to practice against." }, { title: "1:1 mentor review", detail: "Feedback from a certified marketplace pro." }, { title: "Marketplace placement", detail: "First client match, guaranteed within 30 days." }],
  },
};

const EXTRAS_BY_SEGMENT = {
  new: [
    { id: "brandkit", name: "Brand Kit", price: "₦30,000 one-time", icon: Palette, blurb: "Logo, palette, guidelines, templates" },
    { id: "pm", name: "Product Manager", price: "₦20,000 / product", icon: Package, blurb: "Launch roadmap & task tracking" },
    { id: "smm", name: "Social Media Manager", price: "₦50,000 / month", icon: Share2, blurb: "Content calendar, captions, posts" },
    { id: "cac", name: "CAC Registration Agent", price: "Agent-billed", icon: FileBadge2, blurb: "We connect you, and earn a referral fee" },
  ],
  scale: [
    { id: "brandkit", name: "Brand Kit Refresh", price: "₦30,000 one-time", icon: Palette, blurb: "Updated logo, palette, guidelines" },
    { id: "pm", name: "Product Manager", price: "₦20,000 / product", icon: Package, blurb: "Roadmap per new product or service line" },
    { id: "smm", name: "Social Media Manager", price: "₦50,000 / month", icon: Share2, blurb: "Content calendar, captions, posts" },
    { id: "ops", name: "Ops & Systems Setup", price: "₦40,000 one-time", icon: Rows3, blurb: "Booking, inventory, or client-tracking systems" },
  ],
  influencer: [
    { id: "brandkit", name: "Brand Kit", price: "₦30,000 one-time", icon: Palette, blurb: "Visual identity, templates, highlight covers" },
    { id: "smm", name: "Social Media Manager", price: "₦50,000 / month", icon: Share2, blurb: "Content calendar, captions, posts" },
    { id: "mediakit", name: "Media Kit & Rate Card", price: "₦25,000 one-time", icon: FileBadge2, blurb: "A pitch-ready deck for brand deals" },
    { id: "contract", name: "Brand Deal Contract Review", price: "Agent-billed", icon: Rows3, blurb: "We connect you, and earn a referral fee" },
  ],
  learn: [
    { id: "mentorship", name: "1:1 Mentorship", price: "₦15,000 / session", icon: Users, blurb: "Direct feedback from a certified pro" },
    { id: "portfolio", name: "Portfolio Review", price: "₦10,000 one-time", icon: FileBadge2, blurb: "Line-by-line feedback before you go live" },
    { id: "boost", name: "Marketplace Boost", price: "₦8,000 / month", icon: Rows3, blurb: "Priority placement in client matching" },
  ],
};

const TOOLS_BY_SEGMENT = {
  new: [
    { id: "a", name: "Name & Tagline Generator", icon: Wand2, prompt: "Describe your idea", placeholder: "A laundry pickup service" },
    { id: "b", name: "Startup Readiness Score", icon: Gauge },
    { id: "c", name: "Client Pain Point Finder", icon: Target, prompt: "Describe your ideal customer", placeholder: "Busy students who need laundry done fast" },
    { id: "d", name: "One-Page Website", icon: Layout },
  ],
  scale: [
    { id: "a", name: "Brand Health Check", icon: Wand2, prompt: "Paste your current website or handle", placeholder: "aminaslaundry.com" },
    { id: "b", name: "Growth Readiness Score", icon: Gauge },
    { id: "c", name: "Customer Feedback Gaps", icon: Target, prompt: "What do customers say when they leave or don't return?", placeholder: "They say it's slow, or they forget to reorder" },
    { id: "d", name: "Upgraded Website Preview", icon: Layout },
  ],
  influencer: [
    { id: "a", name: "Brand Name / Handle Generator", icon: Wand2, prompt: "Describe your niche", placeholder: "Budget cooking for students" },
    { id: "b", name: "Audience Clarity Score", icon: Gauge },
    { id: "c", name: "Content Pillar Finder", icon: Target, prompt: "Who do you want watching, and why?", placeholder: "Young renters who want to eat well on little money" },
    { id: "d", name: "Media Kit Preview", icon: Layout },
  ],
  learn: [
    { id: "a", name: "Skills-Track Matcher", icon: Wand2, prompt: "What are you drawn to, and how do you like to work?", placeholder: "Content and captions, structured deadlines" },
    { id: "b", name: "Track Readiness Score", icon: Gauge },
    { id: "c", name: "Portfolio Gap Finder", icon: Target, prompt: "Describe the kind of client work you want to be ready for", placeholder: "Managing Instagram for a small skincare brand" },
    { id: "d", name: "Certification Preview", icon: Layout },
  ],
};

/* Maps each segment+tool-id to the real backend endpoint and how to
   build its payload from the shared free-text inputs. Segment "a"
   tools differ in meaning (name generator vs brand health check vs
   skills matcher) so this can't be a flat id->endpoint table. */
const TOOL_ENDPOINT = {
  new: {
    a: { path: "/api/tools/name-tagline", build: (input) => ({ idea: input }) },
    b: { path: "/api/tools/readiness-score", build: (input, ctx) => ({ answers: { idea: ctx.businessIdea, segment: ctx.seg } }) },
    c: { path: "/api/tools/pain-point-finder", build: (input) => ({ customerDescription: input }) },
    d: { path: "/api/tools/website-preview", build: (input, ctx) => ({ idea: ctx.businessIdea || input, segment: ctx.seg }) },
  },
  scale: {
    a: { path: "/api/tools/brand-health-check", build: (input) => ({ url: input }) },
    b: { path: "/api/tools/readiness-score", build: (input, ctx) => ({ answers: { idea: ctx.businessIdea, segment: ctx.seg } }) },
    c: { path: "/api/tools/pain-point-finder", build: (input) => ({ customerDescription: input }) },
    d: { path: "/api/tools/website-preview", build: (input, ctx) => ({ idea: ctx.businessIdea || input, segment: ctx.seg }) },
  },
  influencer: {
    a: { path: "/api/tools/name-tagline", build: (input) => ({ idea: input }) },
    b: { path: "/api/tools/readiness-score", build: (input, ctx) => ({ answers: { idea: ctx.businessIdea, segment: ctx.seg } }) },
    c: { path: "/api/tools/pain-point-finder", build: (input) => ({ customerDescription: input }) },
    d: { path: "/api/tools/website-preview", build: (input, ctx) => ({ idea: ctx.businessIdea || input, segment: ctx.seg }) },
  },
  learn: {
    a: { path: "/api/tools/skills-match", build: (input) => ({ answers: { interests: input } }) },
    b: { path: "/api/tools/readiness-score", build: (input, ctx) => ({ answers: { idea: ctx.businessIdea, segment: ctx.seg } }) },
    c: { path: "/api/tools/pain-point-finder", build: (input) => ({ customerDescription: input }) },
    d: { path: "/api/tools/website-preview", build: (input, ctx) => ({ idea: ctx.businessIdea || input, segment: ctx.seg }) },
  },
};

function naira(n) {
  return "₦" + n.toLocaleString("en-NG");
}

function slugify(s) {
  return (s || "yourbrand").toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "yourbrand";
}

/* ---------- Shared UI ---------- */

function StitchRail({ stepIndex, onJump }) {
  return (
    <div className="hidden md:flex flex-col items-start gap-0 pt-10 pl-2 w-44 shrink-0">
      {STEPS.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        return (
          <button key={s.key} onClick={() => onJump(i)} className="group relative flex items-start gap-3 pb-8 text-left last:pb-0">
            {i !== STEPS.length - 1 && (
              <span
                className={`absolute left-[7px] top-4 h-full w-px ${done ? "bg-[#1CB5C9]" : ""}`}
                style={done ? {} : { backgroundImage: "repeating-linear-gradient(to bottom, #d6d3d1 0, #d6d3d1 3px, transparent 3px, transparent 7px)" }}
              />
            )}
            <span className={`relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-[#1CB5C9] bg-[#1CB5C9]" : active ? "border-[#12182B] bg-white" : "border-[#D9D4C8] bg-white"}`}>
              {done && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
              {active && <span className="h-1.5 w-1.5 rounded-full bg-[#12182B]" />}
            </span>
            <span className={`text-[12.5px] leading-4 font-medium tracking-tight ${active ? "text-[#12182B]" : done ? "text-[#453F2E]" : "text-[#9A9384]"}`}>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PhoneChrome({ children }) {
  return (
    <div className="relative mx-auto w-[360px] max-w-full rounded-[2.25rem] border-[6px] border-[#12182B] bg-[#F7F3EC] shadow-2xl overflow-hidden">
      <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#12182B]" />
      <div className="relative h-[680px] overflow-y-auto pt-8 pb-6 px-6">{children}</div>
    </div>
  );
}

function Header({ eyebrow, title, sub }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1CB5C9]">{eyebrow}</p>}
      <h2 className="font-serif text-2xl font-bold leading-tight text-[#12182B]">{title}</h2>
      {sub && <p className="mt-1.5 text-[13.5px] leading-5 text-[#5C5747]">{sub}</p>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`w-full rounded-xl bg-[#12182B] py-3 text-sm font-semibold text-[#F7F3EC] transition hover:bg-[#1B2338] disabled:cursor-not-allowed disabled:bg-[#D9D4C8] disabled:text-[#726C5C] flex items-center justify-center gap-1.5 ${className}`}>
      {children}
    </button>
  );
}

function BackLink({ onClick }) {
  return (
    <button onClick={onClick} className="w-full py-2 text-center text-[13px] font-medium text-[#726C5C] hover:text-[#453F2E]">
      Back
    </button>
  );
}

/* ---------- Main ---------- */

export default function StartItDemo({ initialSegment, onExit } = {}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [businessIdea, setBusinessIdea] = useState("");
  const [segment, setSegment] = useState(initialSegment || null);
  const [lang, setLang] = useState(null);
  const [openTool, setOpenTool] = useState(null);
  const [toolsSeen, setToolsSeen] = useState([]);
  const [toolInputs, setToolInputs] = useState({});
  const [tier, setTier] = useState("growth");
  const [extras, setExtras] = useState(["brandkit"]);
  const [connected, setConnected] = useState([]);
  const [posted, setPosted] = useState(false);

  const seg = segment || "new";
  const tools = TOOLS_BY_SEGMENT[seg];
  const tiers = TIERS_BY_SEGMENT[seg];
  const extrasOptions = EXTRAS_BY_SEGMENT[seg];

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const inputFor = (toolId) => toolInputs[toolId] || "";
  const setInputFor = (toolId, val) => setToolInputs((prev) => ({ ...prev, [toolId]: val }));
  const effectiveIdea = (toolId) => inputFor(toolId).trim() || businessIdea;

  const generated = useToolCall(TOOL_ENDPOINT[seg].a.path, {
    demoFn: () => {
      const seed = effectiveIdea("a").trim().length;
      const names = ["Lumora", "Verdant Fold", "Brightline", "Kindred Co.", "Nova Thread"];
      const taglines = [
        "Small beginnings, sharp intentions.",
        "Built with care, worn with pride.",
        "Where your idea finally looks the part.",
        "Quiet confidence, loud results.",
        "For the ones just getting started.",
      ];
      const i = seed % names.length;
      return { names: [names[i]], tagline: taglines[i] };
    },
  });

  const readiness = useToolCall(TOOL_ENDPOINT[seg].b.path, {
    demoFn: () => {
      const base = 40 + (businessIdea.trim().length % 45);
      const score = Math.min(base, 92);
      return {
        score,
        strengths: ["Clear idea of who you're serving"],
        gaps: ["Positioning isn't locked down yet", "No pricing structure defined"],
        summary: "Early but promising — the fundamentals need a pass.",
      };
    },
  });

  const painPoints = useToolCall(TOOL_ENDPOINT[seg].c.path, {
    demoFn: () => {
      const idea = effectiveIdea("c");
      if (!idea.trim()) return { pain_points: [] };
      const bank =
        seg === "scale"
          ? ["They mention slow response times when they reach out.", "Repeat customers say reordering isn't easy.", "Pricing questions come up more than they should this far in."]
          : seg === "influencer"
          ? ["Your best content doesn't clearly point to one clear theme yet.", "New viewers can't tell what you're 'the person for' in 5 seconds.", "There's no consistent hook format viewers come back for."]
          : ["They don't trust a service they can't verify is reliable.", "Pricing feels unclear until the very last step.", "There's no easy way to reorder or repeat what worked last time."];
      return { pain_points: bank.map((point) => ({ point, why_it_matters: "" })) };
    },
  });

  const websitePreview = useToolCall(TOOL_ENDPOINT[seg].d.path, {
    demoFn: () => ({
      headline: `${generated.result?.names?.[0] || "Your Brand"} — built for the people who need it`,
      subheadline: generated.result?.tagline || "A one-page site, ready to preview.",
      sections: [
        { title: "What we do", body: "A short, clear line about the offer." },
        { title: "Why it works", body: "The one thing that makes this trustworthy." },
        { title: "Get started", body: "One clear next step for a visitor to take." },
      ],
    }),
  });


  const monthlyTotal = useMemo(() => {
    const t = tiers.find((t) => t.id === tier);
    let total = t.price;
    if (extras.includes("smm")) total += 50000;
    return total;
  }, [tier, extras, tiers]);

  const toggleExtra = (id) => setExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  const markToolSeen = (id) => {
    setOpenTool(id);
    setToolsSeen((prev) => (prev.includes(id) ? prev : [...prev, id]));
    // Tools b and d don't need their own text input — they run off
    // context already collected (businessIdea, generated name), so
    // fire automatically the first time they're opened.
    if (id === "b" && readiness.status === "idle") {
      readiness.run(TOOL_ENDPOINT[seg].b.build(null, { businessIdea, seg }));
    }
    if (id === "d" && websitePreview.status === "idle") {
      websitePreview.run(TOOL_ENDPOINT[seg].d.build(businessIdea, { businessIdea, seg }));
    }
  };
  const runTool = (toolId, inputValue) => {
    const call = { a: generated, c: painPoints }[toolId];
    if (!call) return;
    call.run(TOOL_ENDPOINT[seg][toolId].build(inputValue, { businessIdea, seg }));
  };
  const toggleConnected = (id) => setConnected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  // Real channels — loaded from Buffer when a backend is configured;
  // falls back to the three demo placeholders otherwise so the flow
  // still walks without a live deployment.
  const DEMO_CHANNELS = [
    { id: "ig", name: "Instagram", icon: Instagram },
    { id: "tt", name: "TikTok", icon: Music2 },
    { id: "wa", name: "WhatsApp Business", icon: MessageCircle },
  ];
  const [liveChannels, setLiveChannels] = useState(null); // null = not fetched / demo mode
  const [postStatus, setPostStatus] = useState("idle"); // idle | posting | done | error
  const [postError, setPostError] = useState(null);

  const apiBase = typeof window !== "undefined" ? window.__STARTIT_API_BASE__ || null : null;
  const channels = liveChannels || DEMO_CHANNELS;

  useEffect(() => {
    if (step !== 8 || !apiBase || liveChannels) return;
    fetch(`${apiBase}/api/integrations/buffer/channels`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("channels_failed"))))
      .then((list) => {
        const iconFor = (service) =>
          service?.includes("instagram") ? Instagram : service?.includes("tiktok") ? Music2 : MessageCircle;
        setLiveChannels(
          (list || []).map((c) => ({ id: c.id, name: c.service, icon: iconFor(c.service) }))
        );
      })
      .catch(() => setLiveChannels([])); // empty = "connect channels on Buffer first" state, not a crash
  }, [step, apiBase, liveChannels]);

  const postNow = async () => {
    const targetIds = connected.length ? connected : channels.slice(0, 1).map((c) => c.id);
    const content = `${generated.result?.names?.[0] || "Your brand"} is officially live 🎉 "${generated.result?.tagline || ""}" — link in bio.`;

    if (!apiBase) {
      // Demo mode — no backend configured, just flip the local flag.
      setPosted(true);
      return;
    }

    setPostStatus("posting");
    setPostError(null);
    try {
      for (const channelId of targetIds) {
        const res = await fetch(`${apiBase}/api/integrations/buffer/post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `post-${channelId}-${liveSlug}`,
          },
          body: JSON.stringify({ channelId, content, userId: name || "anonymous" }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Post failed.");
        }
      }
      setPostStatus("done");
      setPosted(true);
    } catch (e) {
      setPostStatus("error");
      setPostError(e.message);
    }
  };

  const displayName = name || "there";
  const liveSlug = slugify(businessIdea || generated.result?.names?.[0]);

  return (
    <div className="min-h-screen w-full bg-[#F1ECE0] px-6 py-10">
      <div className="mx-auto flex max-w-4xl items-start justify-center gap-8">
        <StitchRail stepIndex={step} onJump={setStep} />

        <div className="flex flex-col items-center">
          <div className="mb-5 flex w-full items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                <path d="M20 6 L32 32 L25 32 L20 20 L15 32 L8 32 Z" fill="#F2B705" stroke="#E0177D" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="30" cy="9" r="2.4" fill="#12B0A6" />
                <circle cx="34" cy="14" r="1.3" fill="#E0177D" />
                <path d="M25 8 Q27 6 26 3" stroke="#8B2A9B" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              </svg>
              <p className="leading-none">
                <span className="block font-serif text-lg font-bold tracking-tight text-[#12182B]">Start-It</span>
                <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">by Ayiprag</span>
              </p>
            </div>
            {onExit && (
              <button
                onClick={onExit}
                aria-label="Exit to homepage"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#726C5C] transition-colors hover:bg-[#12182B]/5 hover:text-[#12182B]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <PhoneChrome>
            {/* 0 WELCOME */}
            {step === 0 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1CB5C9]">App walkthrough</p>
                  <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] text-[#12182B]">Bringing<br />brands to<br />life.</h1>
                  <p className="mt-4 text-[13.5px] leading-5 text-[#5C5747]">From idea to live — brand strategy, identity, and support, built for founders and creators across Africa.</p>
                </div>
                <div>
                  <div className="mb-4 h-24 w-full rounded-2xl bg-[#12182B] p-4">
                    <div className="flex h-full flex-col justify-between">
                      <div className="h-1.5 w-10 rounded-full bg-[#1CB5C9]" />
                      <p className="font-serif text-sm text-[#F7F3EC]">Idea → Brand → Live</p>
                    </div>
                  </div>
                  <PrimaryButton onClick={goNext}>Begin <ChevronRight className="h-4 w-4" /></PrimaryButton>
                </div>
              </div>
            )}

            {/* 1 SIGN UP */}
            {step === 1 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 1" title="Create your account" sub="It takes less than a minute to start." />
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#726C5C]">Full name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Amina Yusuf" className="w-full rounded-xl border border-[#D9D4C8] bg-white px-3.5 py-2.5 text-sm text-[#12182B] outline-none focus:border-[#12182B]" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#726C5C]">One line about what you're building</label>
                      <input value={businessIdea} onChange={(e) => setBusinessIdea(e.target.value)} placeholder="A laundry pickup service" className="w-full rounded-xl border border-[#D9D4C8] bg-white px-3.5 py-2.5 text-sm text-[#12182B] outline-none focus:border-[#12182B]" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <PrimaryButton onClick={goNext}>Create account <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 2 SEGMENT */}
            {step === 2 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 2" title="Which one is you?" sub="This changes what the app shows you next — nothing else." />
                  <div className="space-y-2.5">
                    {SEGMENTS.map((s) => {
                      const Icon = s.icon;
                      const active = segment === s.id;
                      return (
                        <button key={s.id} onClick={() => setSegment(s.id)} className={`flex w-full items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition ${active ? "border-[#1B2338] bg-[#F7F3EC]" : "border-[#E4DFD1] bg-white"}`}>
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#1B2338]" : "bg-[#F1ECE0]"}`}>
                            <Icon className={`h-4 w-4 ${active ? "text-[#F7F3EC]" : "text-[#726C5C]"}`} />
                          </span>
                          <span>
                            <span className="block text-[13.5px] font-semibold text-[#12182B]">{s.label}</span>
                            <span className="block text-[12px] text-[#726C5C]">{s.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <PrimaryButton onClick={goNext} disabled={!segment}>Continue <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 3 LANGUAGE */}
            {step === 3 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 3" title="Continue in your language" sub="Every tool, tier, and extra will speak back to you in this language." />
                  <div className="grid grid-cols-2 gap-2.5">
                    {LANGUAGES.map((l) => (
                      <button key={l} onClick={() => setLang(l)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition ${lang === l ? "border-[#12182B] bg-[#12182B] text-[#F7F3EC]" : "border-[#D9D4C8] bg-white text-[#453F2E] hover:border-[#9A9384]"}`}>
                        <Globe2 className={`h-3.5 w-3.5 shrink-0 ${lang === l ? "text-[#1CB5C9]" : "text-[#9A9384]"}`} />
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <PrimaryButton onClick={goNext} disabled={!lang}>Continue <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 4 FREE TOOLS (branched) */}
            {step === 4 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 4 · Free" title="See where you stand" sub="Real insight before you spend a naira. Tap each tool." />
                  <div className="space-y-2.5">
                    {tools.map((t) => {
                      const Icon = t.icon;
                      const seen = toolsSeen.includes(t.id);
                      const open = openTool === t.id;
                      return (
                        <div key={t.id}>
                          <button onClick={() => markToolSeen(open ? null : t.id)} className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${open ? "border-[#12182B] bg-[#12182B]/[0.03]" : "border-[#D9D4C8] bg-white"}`}>
                            <span className="flex items-center gap-2.5">
                              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${seen ? "bg-[#CFF0F2]" : "bg-[#F1ECE0]"}`}>
                                <Icon className={`h-3.5 w-3.5 ${seen ? "text-[#1CB5C9]" : "text-[#726C5C]"}`} />
                              </span>
                              <span className="text-[13px] font-medium text-[#12182B]">{t.name}</span>
                            </span>
                            {seen && <Check className="h-3.5 w-3.5 text-emerald-700" />}
                          </button>

                          {open && (
                            <div className="mt-2 rounded-xl border border-dashed border-[#D9D4C8] bg-[#F7F3EC] p-3.5">
                              {t.id === "a" && (
                                <div>
                                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#726C5C]">{t.prompt}</label>
                                  <input value={inputFor("a")} onChange={(e) => setInputFor("a", e.target.value)} placeholder={businessIdea || t.placeholder} className="mb-2 w-full rounded-lg border border-[#D9D4C8] bg-white px-3 py-2 text-[13px] text-[#12182B] outline-none focus:border-[#12182B]" />
                                  <button onClick={() => runTool("a", inputFor("a") || businessIdea)} disabled={generated.status === "loading"} className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#1CB5C9] disabled:opacity-50">
                                    {generated.status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    {generated.status === "done" ? "Regenerate" : "Generate"}
                                  </button>
                                  {generated.status === "error" && (
                                    <p className="flex items-center gap-1.5 text-[12px] text-red-700"><AlertTriangle className="h-3 w-3" />{generated.error?.message}</p>
                                  )}
                                  {generated.status === "done" && generated.result && (
                                    <div>
                                      <p className="font-serif text-lg font-bold text-[#12182B]">{generated.result.names?.[0]}</p>
                                      <p className="text-[13px] italic text-[#5C5747]">"{generated.result.tagline}"</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {t.id === "b" && (
                                <div className="space-y-2">
                                  {readiness.status === "loading" && <p className="flex items-center gap-1.5 text-[12px] text-[#726C5C]"><Loader2 className="h-3 w-3 animate-spin" />Scoring...</p>}
                                  {readiness.status === "error" && (
                                    <button onClick={() => readiness.run(TOOL_ENDPOINT[seg].b.build(null, { businessIdea, seg }))} className="flex items-center gap-1.5 text-[12px] text-red-700"><RotateCcw className="h-3 w-3" />{readiness.error?.message} — retry</button>
                                  )}
                                  {readiness.status === "done" && readiness.result && (
                                    <>
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-serif text-2xl font-bold text-[#12182B]">{readiness.result.score}</span>
                                        <span className="text-[11px] text-[#726C5C]">/ 100</span>
                                      </div>
                                      <p className="text-[12px] text-[#5C5747]">{readiness.result.summary}</p>
                                      {readiness.result.strengths?.length > 0 && (
                                        <div className="pt-1">
                                          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#726C5C]">Strengths</p>
                                          {readiness.result.strengths.map((s, i) => <p key={i} className="text-[12.5px] text-[#453F2E]">• {s}</p>)}
                                        </div>
                                      )}
                                      {readiness.result.gaps?.length > 0 && (
                                        <div className="pt-1">
                                          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#726C5C]">Gaps</p>
                                          {readiness.result.gaps.map((g, i) => <p key={i} className="text-[12.5px] text-[#453F2E]">• {g}</p>)}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                              {t.id === "c" && (
                                <div>
                                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#726C5C]">{t.prompt}</label>
                                  <input value={inputFor("c")} onChange={(e) => setInputFor("c", e.target.value)} placeholder={t.placeholder} className="mb-2 w-full rounded-lg border border-[#D9D4C8] bg-white px-3 py-2 text-[13px] text-[#12182B] outline-none focus:border-[#12182B]" />
                                  <button onClick={() => runTool("c", inputFor("c"))} disabled={!inputFor("c").trim() || painPoints.status === "loading"} className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#1CB5C9] disabled:opacity-50">
                                    {painPoints.status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    {painPoints.status === "done" ? "Regenerate" : "Find pain points"}
                                  </button>
                                  {painPoints.status === "error" && (
                                    <p className="flex items-center gap-1.5 text-[12px] text-red-700"><AlertTriangle className="h-3 w-3" />{painPoints.error?.message}</p>
                                  )}
                                  {painPoints.status === "done" && (!painPoints.result?.pain_points || painPoints.result.pain_points.length === 0) && (
                                    <p className="text-[13px] text-[#726C5C]">Type something above to see this.</p>
                                  )}
                                  {painPoints.status === "done" && painPoints.result?.pain_points?.length > 0 && (
                                    <ul className="space-y-1.5">
                                      {painPoints.result.pain_points.map((p, i) => (
                                        <li key={i} className="flex gap-2 text-[13px] leading-4 text-[#453F2E]">
                                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#159AAC]" />{p.point}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                              {t.id === "d" && (
                                <div>
                                  {websitePreview.status === "loading" && <p className="flex items-center gap-1.5 text-[12px] text-[#726C5C]"><Loader2 className="h-3 w-3 animate-spin" />Building preview...</p>}
                                  {websitePreview.status === "error" && (
                                    <button onClick={() => websitePreview.run(TOOL_ENDPOINT[seg].d.build(businessIdea, { businessIdea, seg }))} className="flex items-center gap-1.5 text-[12px] text-red-700"><RotateCcw className="h-3 w-3" />{websitePreview.error?.message} — retry</button>
                                  )}
                                  {websitePreview.status === "done" && websitePreview.result && (
                                    <div className="overflow-hidden rounded-lg border border-[#D9D4C8] bg-white">
                                      <div className="bg-[#12182B] px-3 py-2"><p className="font-serif text-sm font-bold text-[#F7F3EC]">{websitePreview.result.headline}</p></div>
                                      <div className="p-3 space-y-2">
                                        <p className="text-[12px] italic text-[#5C5747]">{websitePreview.result.subheadline}</p>
                                        {websitePreview.result.sections?.map((s, i) => (
                                          <div key={i}>
                                            <p className="text-[11px] font-semibold text-[#12182B]">{s.title}</p>
                                            <p className="text-[11.5px] text-[#726C5C]">{s.body}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <PrimaryButton onClick={goNext}>See paid tiers <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 5 TIER (branched) */}
            {step === 5 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 5" title="Choose your tier" sub="Matched to where you are right now." />
                  <div className="space-y-2.5">
                    {tiers.map((t) => (
                      <button key={t.id} onClick={() => setTier(t.id)} className={`relative w-full rounded-xl border-2 p-3.5 text-left transition ${tier === t.id ? "border-[#1B2338] bg-white" : "border-[#E4DFD1] bg-white/60"}`}>
                        {t.recommended && <span className="absolute -top-2 right-3 rounded-full bg-[#12182B] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[#6BD3D8]">Most chosen</span>}
                        <div className="flex items-center justify-between">
                          <p className="font-serif text-base font-bold text-[#12182B]">{t.name}</p>
                          <p className="font-mono text-sm font-semibold text-[#12182B]">{naira(t.price)}<span className="text-[10px] font-normal text-[#9A9384]">/mo</span></p>
                        </div>
                        <p className="mb-2 text-[12px] italic text-[#726C5C]">{t.tagline}</p>
                        <ul className="space-y-1">
                          {t.features.map((f) => (
                            <li key={f} className="flex gap-1.5 text-[12px] text-[#5C5747]"><Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-700" />{f}</li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <PrimaryButton onClick={goNext}>Continue <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 6 TIER WELCOME (branched) */}
            {step === 6 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800"><Check className="h-5 w-5 text-emerald-50" strokeWidth={3} /></span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1CB5C9]">{tiers.find((t) => t.id === tier)?.name} unlocked</p>
                      <h2 className="font-serif text-xl font-bold text-[#12182B]">Here's what's already moving</h2>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {TIER_UNLOCKS[seg][tier].map((u) => (
                      <div key={u.title} className="rounded-xl border border-[#E4DFD1] bg-white p-3.5">
                        <p className="text-[13px] font-semibold text-[#12182B]">{u.title}</p>
                        <p className="mt-0.5 text-[12px] leading-4 text-[#726C5C]">{u.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-[#F7F3EC] px-3.5 py-3">
                    <p className="text-[12px] leading-4 text-[#1B2338]">Work is already underway — nothing here waits on you.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <PrimaryButton onClick={goNext}>Continue to extras <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 7 EXTRAS (branched) */}
            {step === 7 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 7 · Optional" title="Add extras" sub="Stack anything you need on top of your tier." />
                  <div className="space-y-2">
                    {extrasOptions.map((e) => {
                      const Icon = e.icon;
                      const active = extras.includes(e.id);
                      return (
                        <button key={e.id} onClick={() => toggleExtra(e.id)} className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${active ? "border-[#159AAC] bg-[#F7F3EC]" : "border-[#D9D4C8] bg-white"}`}>
                          <span className="flex items-center gap-2.5">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? "bg-[#A9E5E8]" : "bg-[#F1ECE0]"}`}><Icon className={`h-3.5 w-3.5 ${active ? "text-[#0E5C68]" : "text-[#726C5C]"}`} /></span>
                            <span>
                              <span className="block text-[13px] font-medium text-[#12182B]">{e.name}</span>
                              <span className="block text-[11px] text-[#726C5C]">{e.blurb}</span>
                            </span>
                          </span>
                          <span className="shrink-0 pl-2 text-right font-mono text-[11px] text-[#5C5747]">{e.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <PrimaryButton onClick={goNext}>Continue to go live <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 8 GO LIVE (new) */}
            {step === 8 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Header eyebrow="Step 8" title="Go live" sub="This is the part that actually publishes something." />

                  <div className="mb-3 rounded-xl border border-[#E4DFD1] bg-white p-3.5">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#726C5C]"><Link2 className="h-3 w-3" /> Your link</p>
                    <div className="flex items-center justify-between rounded-lg bg-[#F7F3EC] px-3 py-2">
                      <span className="font-mono text-[12.5px] text-[#1B2338]">startit.app/{liveSlug}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#1CB5C9]" />
                    </div>
                  </div>

                  <div className="mb-3 rounded-xl border border-[#E4DFD1] bg-white p-3.5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#726C5C]">
                      {liveChannels ? "Post to" : "Connect your channels"}
                    </p>
                    {liveChannels && liveChannels.length === 0 && (
                      <p className="mb-2 text-[12px] text-[#726C5C]">No channels connected on Buffer yet — connect one at buffer.com first.</p>
                    )}
                    <div className="space-y-1.5">
                      {channels.map((c) => {
                        const Icon = c.icon;
                        const on = connected.includes(c.id);
                        return (
                          <button key={c.id} onClick={() => toggleConnected(c.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${on ? "border-emerald-700 bg-emerald-50" : "border-[#E4DFD1] bg-white"}`}>
                            <span className="flex items-center gap-2 text-[13px] text-[#453F2E]"><Icon className="h-3.5 w-3.5 text-[#726C5C]" />{c.name}</span>
                            <span className={`text-[11px] font-semibold ${on ? "text-emerald-700" : "text-[#9A9384]"}`}>{on ? (liveChannels ? "Selected" : "Connected") : (liveChannels ? "Select" : "Connect")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E4DFD1] bg-white p-3.5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#726C5C]">First post, ready</p>
                    <div className="rounded-lg bg-[#F7F3EC] p-2.5">
                      <p className="font-serif text-[13px] font-bold text-[#12182B]">{generated.result?.names?.[0] || "Your brand"} is officially live 🎉</p>
                      <p className="mt-0.5 text-[12px] text-[#5C5747]">"{generated.result?.tagline || ""}" — link in bio.</p>
                    </div>
                    {postStatus === "error" && (
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-red-700"><AlertTriangle className="h-3 w-3" />{postError}</p>
                    )}
                    <button
                      onClick={postNow}
                      disabled={posted || postStatus === "posting" || (liveChannels && liveChannels.length === 0)}
                      className={`mt-2.5 w-full rounded-lg py-2 text-[12.5px] font-semibold transition flex items-center justify-center gap-1.5 ${posted ? "bg-emerald-100 text-emerald-700" : "bg-[#12182B] text-[#F7F3EC] hover:bg-[#1B2338] disabled:opacity-50"}`}
                    >
                      {postStatus === "posting" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {posted ? "Posted ✓" : postStatus === "posting" ? "Posting..." : "Post now"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <PrimaryButton onClick={goNext}>Go to dashboard <ChevronRight className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}

            {/* 9 DASHBOARD (new, replaces static summary) */}
            {step === 9 && (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1CB5C9]"><Rocket className="h-5 w-5 text-[#12182B]" /></span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1CB5C9]">Live</p>
                      <h2 className="font-serif text-xl font-bold text-[#12182B]">{displayName}, you're out there.</h2>
                    </div>
                  </div>

                  <div className="space-y-2.5 rounded-xl border border-[#E4DFD1] bg-white p-3.5">
                    <div className="flex justify-between text-[13px]"><span className="text-[#726C5C]">Live link</span><span className="font-mono font-medium text-[#0E5C68]">startit.app/{liveSlug}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-[#726C5C]">Channels connected</span><span className="font-medium text-[#12182B]">{connected.length || "None yet"}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-[#726C5C]">First post</span><span className={`font-medium ${posted ? "text-emerald-700" : "text-[#9A9384]"}`}>{posted ? "Live ✓" : "Not yet"}</span></div>
                    <div className="flex justify-between text-[13px]"><span className="text-[#726C5C]">Tier</span><span className="font-medium text-[#12182B]">{tiers.find((t) => t.id === tier)?.name}</span></div>
                    <div className="border-t border-dashed border-[#E4DFD1] pt-2.5 flex justify-between">
                      <span className="text-[13px] font-medium text-[#453F2E]">Monthly total</span>
                      <span className="font-mono text-base font-bold text-[#12182B]">{naira(monthlyTotal)}</span>
                    </div>
                  </div>

                  <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#726C5C]">Your ongoing hub</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Message brand manager", icon: Users },
                      { label: "Post again", icon: Share2 },
                      { label: "Add an extra", icon: Package },
                      { label: "View performance", icon: TrendingUp },
                    ].map((tile) => {
                      const Icon = tile.icon;
                      return (
                        <div key={tile.label} className="flex flex-col gap-1.5 rounded-xl border border-[#E4DFD1] bg-white p-3">
                          <Icon className="h-4 w-4 text-[#1CB5C9]" />
                          <span className="text-[12px] font-medium leading-4 text-[#453F2E]">{tile.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <PrimaryButton onClick={() => setStep(0)} className="bg-[#1CB5C9] text-[#12182B] hover:bg-[#6BD3D8]">Start another <Rocket className="h-4 w-4" /></PrimaryButton>
                  <BackLink onClick={goBack} />
                </div>
              </div>
            )}
          </PhoneChrome>

          <p className="mt-5 text-center text-[12px] text-[#9A9384]">Demo walkthrough · Start-It by Ayiprag</p>
        </div>
      </div>
    </div>
  );
}
