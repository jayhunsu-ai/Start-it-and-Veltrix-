# VELTRIX / BRO / Start-It — Full Feature Inventory

Pulled from: `VELTRIX_INVESTOR_PITCH.pdf`, `Veltrix_Investor_Brief.pdf`, and the two Slack "impossible proposal" threads in #start-it (*The Impossible Proposal — hyperscale architecture* and *Moonshot Proposals — BRO/Veltrix/Start-It*). Nothing here is prioritized or scoped yet — this is the raw list to cut into cogs from.

---

## 1. VELTRIX Investor Pitch — the nine verticals

### Brain (shared substrate — not a product, the foundation)
- Pattern Extraction Engine (shared: GridPulse, APEX, BeatForge)
- Epistemology / Confidence layer (shared: Verdikt, MOSAIC, APEX)
- Synthesis Loop (shared: APEX, BeatForge, Sunflower)
- Anomaly Detection (shared: The Bee, GridPulse)
- Conflict Engine (shared: MOSAIC, APEX regime detection)
- Memory Architecture (shared: all verticals)

### GridPulse — power/infrastructure intelligence
- Community outage reporting (free tier)
- Zone-level outage prediction
- Personal prediction dashboard (individual tier)
- Generator automation (business tier)
- API access (business tier)
- Advance outage alerts
- Full sensor suite (industrial tier)
- Priority prediction + SLA (industrial tier)
- Licensed P2P energy trading (v4, long-horizon)

### Verdikt — legal intelligence
- Contract upload → instant risk analysis
- Clause-by-clause explanation
- Worst-case scenario assessment
- Redline suggestions under Nigerian law
- Clause Genome Database (compounding proprietary corpus)
- Law firm API / white-label
- Enterprise contract bundles (banks, accelerators)

### BeatForge — music production
- Browser-native DAW
- Afrobeats-specific groove quantization (micro-timing)
- AI stem generation
- Beat DNA fingerprint registry
- Naira-native marketplace payments
- Neural Ear model (trains on user-uploaded beats)

### Crypto Signals — market intelligence
- P2P premium as a leading trading indicator
- Naira devaluation correlation signals
- CBN policy-event timing signals
- Nigerian-specific scam-pattern detection
- Standard / Pro tiers

### APEX — autonomous trading
- Mode 1 (assisted) → Mode 3 (autonomous) progression, gated on proven alpha
- Consumes signals discovered by Crypto Signals

### FM Real — football simulation
- NPFL / CAF league database
- Player Minds (player psychology/attributes modeling)
- African football management sim (a market FM has never built for)

### MOSAIC — knowledge graph
- African-first knowledge base (the domain Wikipedia underserves)
- Conflict engine
- Built-in governance

### The Bee — automation layer
- Cross-product automation
- Budget enforcement
- Anomaly detection
- "African Zapier," built inward-first (internal automation before external product)

---

## 2. Veltrix Investor Brief — BRO

### Product architecture (spokes around one ambient core)
- Emotional Presence
- Opportunity Engine
- Financial Guidance
- Legal & Admin Help
- Language-native (Pidgin, Yoruba, Igbo, Hausa)
- Offline-capable

### The Companion
- Ambient presence — ever-present, not opened, never asks "how are you feeling"
- Context awareness of the user's actual situation as it unfolds

### The Engine
- Natural-language / voice-note input describing a situation
- Surfaces one next step, not a list of options — the contact, the form, the way through

### Monetization features
- Freemium core (free Companion + basic Engine)
- Premium tier (₦2,500–₦5,000/mo): unlimited engine access, priority response, offline mode
- B2B/enterprise: employer wellness seats, SME tooling, API access
- Transaction revenue: micro-commissions, referral fees, financial-product referrals

---

## 3. GUIDELINES.md — binding engineering constraints (not features, but design law)

Not a feature list, but every feature above has to be built inside these rules:
- Monolith-first; split a service out only for genuine scaling profile, team ownership, or security-boundary reasons
- API versioning from day one, idempotency keys on any money/resource-creating POST, pagination from day one, consistent error shape, rate limiting before a marketing page
- SQL (Postgres) as default; NoSQL/vector DB only for a proven document-shaped or embeddings use case
- Build only what's core differentiation (Brain); buy/open-source everything else (auth, payments, email, observability)
- Strong consistency for money/inventory; eventual consistency elsewhere — decided per subsystem, not per app
- ADR (Architecture Decision Record) before any non-trivial architectural decision
- §18 Hyperscale Playbook exists but is explicitly gated — every item needs a real triggering metric before it's built, not "we might get big"

---

## 4. Slack — "The Impossible Proposal" (hyperscale architecture at tens of millions of users)

Proposed, then immediately torn down by the same author as premature at current (zero-row) scale. Filed for later, not built now:

- Multi-region active-active (with wallet/subscription state pinned CP, everything else AP)
- Postgres sharding by `user_id` hash
- Event backbone (Kafka/NATS) replacing every direct point-to-point integration call
- Orchestrator hardened as its own control plane: per-worker signed identity, real task queue instead of poll-based claiming, horizontal worker scaling
- Payments at scale: append-only ledger, saga pattern across payment confirmation + entitlement + notification, deep provider abstraction (Paystack/Flutterwave as a routing decision)
- AI inference at scale: cross-provider/region load balancing, semantic caching, hard cost ceiling with graceful model-tier degradation
- Chaos engineering (game days, fault injection) — once there's redundancy worth breaking
- FinOps as its own discipline — cost-per-request dashboard once the cost structure gets complex

**The "steady foundation" list — cheap now, brutally expensive later, so do these regardless of scale:**
1. Design every table around `user_id` as the natural shard key today (don't shard yet)
2. Kill the in-process idempotency `Map()` now — move all side-effecting writes to the DB-backed idempotency layer (it's already broken at current scale, not just future scale)
3. Payments: append-only ledger from the first row, never `UPDATE` a money-moving row
4. Outbox pattern on the existing `events` table, even with zero consumers yet
5. Auth as per-service signed tokens, not a static shared secret, since it's being rebuilt anyway
6. Provider abstraction on Paystack/Flutterwave from day one, even with one provider live
7. Staging environment now
8. ADR discipline starting now

---

## 5. Slack — "Moonshot Proposals" (BRO / Veltrix / Start-It)

### BRO — Companion layer
1. **Voice-clone griot** — BRO replies in a voice cloned from the user's own recordings, or a late relative's
2. **Ambient crisis prediction** — cross-references phone-use rhythm, P2P panic-selling behavior, missed payments, and typing cadence; reaches out first, in Pidgin, before being asked; routes straight to a real human counselor network
3. **Family/community pods** — a household's BROs share an aggregated, privacy-preserving wellbeing signal ("seems okay" / "seems off"), not raw content
4. **Generational vault** — "future letters" extended multi-generationally, unlocking at life milestones (18th birthday, first heartbreak, wedding day)
5. **Full offline mode via SMS** — a two-way SMS relationship with BRO, no app required

### Veltrix — Engine layer
1. **Nigeria Nowcast** — GridPulse + Crypto Signals + Verdikt + BeatForge fused into one hyperlocal live economic index, sold to banks/DISCOs/telcos/government
2. **Verdikt negotiation agent** — a WhatsApp-native agent that negotiates directly with the other party (landlord, supplier, client) in Pidgin, escalating only key decisions
3. **GridPulse hardware moonshot** — free $2 IoT power-sensor dongle, funded by data resale to DISCOs/insurers
4. **BeatForge genre venture fund** — Neural Ear detects emergent Afrobeats micro-genres before they're named; first-refusal licensing/A&R
5. **The Bee as autonomous capital allocator** — reallocates marketing spend, engineering hours, and revenue-share across verticals inside human-sign-off guardrails

### Start-It — chassis (onboarding + marketplace)
1. **Full 3D tailoring onboarding** — brand kit visibly stitched together in real time (logo/palette/tagline) via the existing three.js pipeline
2. **Marketplace loop closure** — certified `learn`-segment users become the `marketplace_talent` pool fulfilling `extras_orders`, with instant Paystack micro-payouts on delivery
3. **Start-It Passport** — one portable cross-vertical reputation object: business-readiness score + Verdikt contract history + Crypto Signals trust score + marketplace delivery record (a from-scratch route to the "Credit Genome" concept)
4. **USSD fallback tier** — the entire onboarding flow on a feature phone with zero data
5. **Voice-only signup** — voiceprint + phone number as credential, tagline/readiness score generated from a spoken description

### Self-critique pass — same moonshots, run through "millions of concurrent users"
- Voice-clone griot: needs cached/precomputed voices or tiered access, or GPU cost bankrupts it
- Ambient crisis prediction: needs a triage layer — human counselor headcount can't scale 1:1 with users
- Family pods: consent-chain auditing gets exponentially harder across millions of linked accounts
- SMS fallback: needs bulk telco aggregator deals, not a simple API call
- GridPulse $2 dongle: a hardware/manufacturing/logistics problem, not a software one
- Verdikt negotiation agent: one systematic model error replicates across every live negotiation at once — real liability surface
- The Bee as capital allocator: classic "autonomous agent with money" risk — needs hard kill-switches and spend ceilings
- 3D tailoring onboarding: **directly contradicts** the already-flagged fix of killing WebGL on mobile — the one moonshot working against the low-end-Android target user
- Start-It Passport / credit scoring: becoming a de facto credit bureau triggers CBN financial-regulation licensing
- USSD tier: the one idea that gets *more* valuable at scale — cheapest channel per user, works where smartphone infra doesn't

---

## 6. Also live in the same Slack thread — current-state findings, not moonshots

Relevant since you're tearing down and rebuilding the current web app:
- Confirmed auth-bypass bug: `StitchRail`'s desktop-only step-jump sidebar calls `onJump(i)` directly, skipping signup/login
- Current onboarding is a `PhoneChrome` (fake phone frame) simulated in-browser — on real mobile this renders as phone-inside-a-phone, and the desktop-only progress rail disappears entirely on mobile instead of adapting
- `three.js` / WebGL renders behind the *entire* app including plain signup forms — flagged as unnecessary GPU/battery load on low-end Android, the actual target device
- No payment provider, `payments`, or `subscriptions` table exists yet — Paystack proposed as primary rail, Flutterwave as secondary/fallback
- Merge proposal on the table: Start-It becomes the umbrella; BRO's Companion and Veltrix's Engine (GridPulse, Verdikt, etc.) become modes/modules on one authenticated dashboard instead of three separate pitches
