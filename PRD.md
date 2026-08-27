# PRD — Start-It / BRO / Veltrix Unified Platform

## 1. What this is
One platform, three surfaces, one shared substrate (Brain/Alfred architecture):
- **Citizen Dashboard** — individuals: BRO Companion + Engine, skill-building, marketplace, mentorship
- **Founder/CEO Dashboard** — comprehensive company command center
- **Team Workspace** — issues, deadlines, escalation, shared with the founder

A citizen can graduate into a founder with a Workspace. Same login, same identity, same underlying data.

## 2. Non-goals (explicit scope boundaries)
- **BRO will not write, debug, or explain code for users.** This is a hard product boundary, not a soft one — it exists to protect founder bandwidth and keep BRO's scope to what it's actually for (companion + opportunity + admin help). Any request that looks like a coding task gets a clear redirect, not a best-effort attempt.
- FM Real and BeatForge are out of the active build for now (deprioritized, not cancelled).
- No dedicated AI hardware (DGX or otherwise) until a real, sustained cost or compliance trigger forces it — see Infrastructure doc §6.
- No engagement-mechanic design patterns (streaks, guilt nudges, artificial urgency) anywhere in BRO — indispensability comes from removing real friction, not from making the product hard to leave.

## 3. Priority verticals
MOSAIC, GridPulse, and Verdikt get full feature builds. Crypto Signals and APEX follow. FM Real/BeatForge are shelved.

## 4. Citizen Dashboard — requirements
- Skill learning tracks with real certification (not self-reported tags)
- Mentorship, open to everyone as both mentor and mentee
- Skill vetting gates before a citizen is surfaced to founders as a candidate
- Monetization clarity per skill (what it earns now, how to earn more)
- "Today's opportunity" — one surfaced match, not a listings wall
- Hyperlocal community bulletin (barter/quick-help requests)
- Reputation object (Start-It Passport) portable across the platform
- Visible, explicit Citizen → Founder bridge once activity/reputation crosses a threshold

## 5. Founder/CEO Dashboard — requirements
- Meetings/events, escalated vs. resolved workspace issues, deadlines, trending tags — one view
- Site + social analytics, next-post guidance, video/photo asset library (Jellyfin/Immich-backed), post + track from the dashboard
- Sector-specific legal concerns (Verdikt-powered), physical CAC registration help, compliance calendar
- Skill/collaboration matching with citizens — **blind-match-first, NDA gate before either party sees specifics** (protects both sides' IP)
- IPO/fundraising readiness, investor CRM, cash-runway tracker (from the ledger, not manual entry), cap table/dilution simulator, grants radar, auto-compiled board prep packs, secure data room
- Founder ideation toolkit: name generation, pain-point articulation, target-audience definition — specialized per founder's actual sector
- "Today's opportunity" for founders too — one concrete next move
- Founder wellbeing signal — burnout detection from work patterns, same substrate as BRO's mood-sensing

## 6. Team Workspace — requirements
- Issue/task tracker: owner, deadline, priority, status
- Auto-escalation path feeding the CEO dashboard's escalated-issues view
- Async standup digest, shared roadmap, shared calendar
- Roles/permissions (founder / teammate / contractor)
- Blameless incident log; bus-factor flag (single-owner-system warning)

## 7. BRO — behavioral requirements
- Voice- or gesture-awakened, in addition to normal open
- Runs as an always-on background presence, fully opt-outable
- Relational knowledge graph memory — connected, weighted, perpetually learning (not a flat log)
- Granular, user-controlled permissions for what it can see/touch on their devices; default narrow
- Can initiate, not just respond
- Design philosophy: **client-faced, not client-centric** — built for the user's independence and wellbeing, never for maximizing time-in-app
- Ties emotional presence into practical action: skills, dashboards, booking, search, health, time management — gentle, not intrusive
- Senses mood changes as they happen
- Genuine, contextual sense of humor — not a canned bit
- Drafts messages for review; never sends autonomously on the user's behalf
- **Will not perform coding tasks** (see Non-goals)

## 8. Payments
- Paystack (primary), Flutterwave (fallback) — percentage-based, no fixed cost
- **Crypto payments** — a third rail (Coinbase Commerce or equivalent), gated on the same Nigerian SEC-VASP/NDPR compliance review already tracked for Sunflower
- All payment writes go through an append-only ledger — no `UPDATE` on a money-moving row, ever

## 9. Security & safety — both users' data and the company's
- Full route-level auth audit before any new feature ships (the StitchRail bypass class of bug does not repeat)
- DB-backed idempotency on every side-effecting write
- Per-service signed tokens, not shared secrets
- RLS policy regression tests in CI
- External penetration test before real payment volume goes live
- Secrets manager, not `.env` files
- Cloudflare WAF/DDoS in front of every public service
- Founder's own decades-of-experience instinct applies here directly: assume the failure mode you haven't seen yet is coming, and build the boring, unglamorous safeguard for it now while it's cheap
