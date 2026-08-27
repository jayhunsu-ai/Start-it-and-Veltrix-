# Two Dashboards, One Workspace — Feature Brainstorm

Structure implied by what you described: every account sits in a **Workspace** (a company/org container). Inside it: a **Founder/CEO Dashboard**, a **Team Workspace** (teammates), and separately, outside any company workspace, a **Citizen Dashboard** for individuals. A citizen can graduate into founding a company and getting a workspace — that's the natural funnel, not two disconnected products.

Not ordered by priority yet, per your note — this is the full brainstorm to trim from.

---

## A. Founder / CEO Dashboard

### Time & attention
- Meetings/events to attend — pulled from workspace calendar + external calendar sync
- Escalated issues awaiting CEO decision (vs. resolved, shown for visibility only)
- Deadlines across every active thread (legal, product, fundraising, compliance) in one view
- Trending tags/topics relevant to their sector — social + market, not just social

### Content & brand
- Site + socials analytics in one pane
- Guidance on next post (data-driven suggestion, not just a blank composer)
- Video generation/editing — backed by a self-hosted media pipeline: your Alfred integration plan already wires **Jellyfin** (organizes generated video output for on-demand playback/archive) and **Immich** (face/object/CLIP visual search over photos — 90k+-star project, genuinely best-in-class for this) into the Creator arm. Reuse that same pattern here as the CEO's brand asset library rather than building a third media store from scratch.
- Post + track posts directly from the dashboard (schedule, publish, see performance) instead of tab-switching to the actual social platforms

### Legal & compliance
- Sector-specific legal concerns, powered by Verdikt (contract risk, regulatory changes relevant to their business type)
- CAC registration assistance (physical/paperwork), status tracking
- Compliance calendar — CAC annual returns, tax filing deadlines, sector-specific filings (CBN/SEC for fintech, NDPR for anyone handling user data)

### People & collaboration
- Citizens with skills the company needs, surfaced as candidates — with a **blind-match-first** flow: skill/portfolio summary shown before identity, and any collaboration "idea" pitch happens under an NDA gate before either side sees specifics. This protects both the citizen's idea and the founder's IP exposure, not just one side.
- Hiring pipeline synced to the same citizen talent pool used on the Citizen Dashboard

### Fundraising & finance
- IPO / fundraising readiness tracker
- Investor connections — warm-intro matching + a lightweight investor CRM (pipeline stage, last contact, notes) rather than a spreadsheet
- For financial-sector businesses specifically: market analysis, news feed, and quant tooling (this is the Crypto Signals/Verdikt substrate applied inward, to the founder's own business instead of just their customers')
- **Confirmed additions:**
  - **Cash runway / burn-rate tracker** — computed automatically from the append-only payments ledger (§18.5 in your own guidelines doc), not a manually-updated spreadsheet
  - **Cap table / dilution simulator** — model a new round before agreeing to terms
  - **Grants / non-dilutive funding radar** alongside VC — Nigerian and pan-African founder grants move fast and get missed without something watching for them
  - **Board-meeting prep pack** — auto-compiled from workspace activity (metrics, decisions, blockers) instead of built by hand each time
  - Auto-refreshing one-pager/teaser generated from live metrics — a pitch deck that updates itself instead of going stale between investor meetings
  - Secure data room for due diligence — controlled document sharing with an access log, so you know who opened what
- **Founder ideation toolkit** — generation of business/product names, pain-point articulation, and target-audience definition, specialized per founder's actual sector and stated context rather than generic startup-advice output. Useful both at founding time and any time they're pivoting or launching a new line.
- **"Today's opportunity" for founders too** — same single-surfaced-match philosophy as the citizen version (below), applied to the CEO: one concrete next move (an investor to follow up with, a grant deadline, a hire to make) instead of a dashboard full of everything at once

### Founder wellbeing (the one nobody puts on a "CEO dashboard" but should)
- A founder is exactly the person BRO's ambient-crisis-detection idea was designed for — burnout detection from work patterns (message cadence, hours logged, missed check-ins), not another metric to check but something that checks on *them*

---

## B. Team Workspace (teammates + founder together)

- Issue/task tracker: owner, deadline, priority, status
- Escalation path — what gets auto-bumped to the CEO dashboard vs. resolved at team level (this is the same data feeding the CEO's "escalated vs. resolved" view above, not a separate system)
- Async standup digest — auto-generated from activity instead of everyone typing "yesterday/today/blockers" by hand
- Shared roadmap/sprint view
- Shared calendar (meetings, deadlines) — the source for the CEO dashboard's meeting list
- Roles & permissions (founder / teammate / contractor — different visibility into financials, legal, etc.)
- Blameless incident log / postmortems (your own guidelines doc, §15 — worth building in from day one, not bolted on after the first real incident)
- Bus-factor flag — quietly surfaces when only one person understands a given system (your guidelines doc names this by name in §16 as a company-killer)
- Lightweight internal knowledge base / onboarding doc space

---

## C. Citizen Dashboard

### Learning & growth
- Skill-learning tracks with certification (ties directly into the `learn` segment already in the Start-It schema)
- Mentorship — open to everyone, not just youth; both being mentored and mentoring (a mentor role is itself a monetizable/reputation-building skill)
- Skill vetting — a real assessment/portfolio review, not a self-reported tag, before a citizen is surfaced to founders as a candidate

### Opportunity & money
- Vetted skills connected to real opportunities (marketplace gigs, founder collaboration requests, employment)
- Clear monetization paths per skill — a citizen should be able to see "here's what this skill typically earns, here's how to level it up to earn more," not just a generic listing
- Reputation object (Start-It Passport, from the earlier moonshot list) that travels with them — portfolio + delivery history + vetted skills in one place

### Timely help — ideas beyond what's already on the table
- "Today's opportunity" — a single surfaced match (gig, mentor session, learning module) instead of a wall of listings, same one-clear-next-step philosophy as BRO's Engine
- Hyperlocal community bulletin — quick help/barter requests within a small radius, for the kind of need that doesn't fit a formal gig ("need a ride to the clinic," "have extra rice to trade")
- Government/CAC paperwork help scaled down for individuals (same engine as the founder's CAC assistance, simpler version)
- Financial literacy nudges tied to real events (a naira devaluation signal from Crypto Signals becomes a plain-language "here's what this means for your savings," not just a trader's chart)
- A visible bridge from Citizen → Founder — once someone's marketplace activity and reputation cross a threshold, the dashboard should tell them "you're ready to register a business," not leave that realization to chance

---

## Note on Jellyfin / Immich

Both are already part of your Alfred integration plan (`alfred_master_integration_plan_FINAL.md`, items 23–24), not new additions:
- **Jellyfin** — self-hosted media server. In your plan, Alfred's Creator arm routes generated video (briefings, MoneyPrinterTurbo/LTX-Video output) here for organized playback instead of a flat folder.
- **Immich** — self-hosted photo/video library, 90k+ GitHub stars, with face recognition, object detection, CLIP visual search, and an existing MCP server (`immich-photo-manager`). In your plan it's the visual-memory layer for Alfred's Steward/Sentinel-Physical arms.

Both are strong reference points for "how good does a single, focused, self-hosted product get" — 90k+ stars is a real signal of what sustained focus on one thing looks like. Worth treating as infrastructure to plug into the CEO dashboard's media/brand-asset library (reuse, don't rebuild), and as a gut-check on ambition rather than something to compete with directly.

---

## D. Veltrix — vertical priority + home-screen behavior

**Priority flag:** MOSAIC, GridPulse, and Verdikt are called out as needing their **full feature package**, not a trimmed MVP slice — these three carry more weight in the plan than the others right now.

**Deprioritized for now:** FM Real and BeatForge are removed from the active product set — not killed permanently, just off the current build list.

**Home-screen behavior, not a separate feature:** ambient crisis prediction isn't its own screen or menu item — it lives on the shared app's home screen the moment it's opened, and only the genuinely important things surface there. The home screen is a filtered, high-signal surface, not an inbox of everything the system noticed.

**Generational vault** — confirmed as a keeper from the earlier moonshot list (multi-generational future letters, unlocking at life milestones).

---

## E. BRO — Companion Architecture

This is BRO's actual runtime behavior, not just its feature list — how it's woken, how it remembers, how it acts, and the design philosophy underneath all of it.

### Presence & activation
- Voice- or gesture-awakened, in addition to however else it's opened
- Runs as a small subprocess that stays with the user perpetually — always-on by default, but fully opt-outable. Someone who doesn't want that presence can turn it off; it's not forced persistence.

### Memory
- A relational knowledge graph, not a flat log — memories are connected to each other, weighted by importance, not stored as an undifferentiated stream
- Learns perpetually — every interaction updates the graph, not just a periodic retrain
- Can organize everything it's given access to (see permissions below) into that same connected structure, rather than keeping each integration's data siloed

### Reach & permissions
- Can interact with things on the user's phone, systems, or desktop — but only what the user explicitly allows, and at whatever granularity they choose (all of it, one app, one folder, nothing). Default should be narrow, not broad-by-default.
- Can initiate, not just respond — it should be able to reach out first when something warrants it, the same way the ambient-crisis-prediction idea already implies

### Design philosophy — client-faced, not client-centric
- BRO exists for the user's good, not to maximize how much of their life routes through it. It should be genuinely useful and present, but the design goal is the user's actual wellbeing and independence, not engagement or centrality for its own sake — this is a real constraint on the product, not just a nice sentiment.

### What it actually helps with
- Emotional presence is foundational, but it isn't siloed from the practical side — it can help with skills (linking into the Citizen Dashboard's learning tracks), managing dashboards, and one part naturally leads into another rather than the user having to context-switch between "the companion" and "the tools"
- Concrete actions: booking things, search, health tracking, time management
- Delivered gently — it should pull the user in, not interrupt or demand attention. Not intrusive.

### Emotional intelligence
- Should sense mood changes as they happen, not only when asked
- Needs a real sense of humor — genuinely funny in context, not a canned joke-generator bolted on for warmth

---

## F. Indispensable through usefulness, not engagement mechanics

The design goal is "life is easier without a way back," reached by removing real friction — not by making the product hard to stop using. Same distinction as email or running water: nobody engineered those to be addictive, they just made going back unthinkable.

### Remove friction from things people already have to do
- A single "life file" — IDs, contracts, insurance, receipts — auto-organized and instantly retrievable when a form asks for them, instead of hunting through WhatsApp for a scanned passport photo
- Photo-a-receipt → auto-logged for tax filing and CAC records, no manual entry
- Voice-note-to-structured-output — a rambling 40-second voice note becomes a calendar event, a todo, or a logged expense automatically
- One unified inbox across WhatsApp, SMS, and email, triaged by BRO so nothing urgent gets buried in the noise

### Cross-vertical glue that only works because it's all one substrate
- A single identity/login across Verdikt, GridPulse, Crypto Signals, the marketplace — no separate accounts per vertical
- Life-event checklists — "starting a business," "moving city," "having a child" — that auto-pull in every relevant vertical instead of the user having to know which product solves which piece
- "If this, then that" personal automations via The Bee — e.g., a predicted outage auto-reminds the user to charge devices and top up generator fuel, without them setting the rule up themselves

### Drafts, not autopilot
- BRO drafts a reply/message for review rather than sending on the user's behalf — saves the composing effort, keeps the person in control of what actually goes out


