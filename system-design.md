# System Design — Start-It / BRO / Veltrix

Guiding rule (from your own GUIDELINES.md, applied consistently below): **design for the shard key and the event shape today; do not build the shard, the bus, or the multi-region topology until a real number forces it.** Everything here is a two-way door except where marked otherwise.

## 1. High-level shape

```
                      ┌─────────────────────────────┐
                      │        Edge / Cloudflare      │  WAF, DDoS, CDN, TLS
                      └──────────────┬────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                     │
        ┌───────▼──────┐    ┌────────▼───────┐    ┌────────▼────────┐
        │  Web (Next.js) │   │ Mobile (RN/Expo)│   │ Desktop (Tauri)  │
        └───────┬────────┘   └────────┬────────┘   └────────┬────────┘
                │                     │                      │
                └─────────────────────┼──────────────────────┘
                                      │  versioned REST API (/v1)
                          ┌───────────▼────────────┐
                          │   API layer (Django+DRF) │  auth, rate limit,
                          │   containerized, stateless│  idempotency middleware
                          └───────────┬────────────┘
                    ┌─────────────────┼──────────────────┐
                    │                 │                   │
            ┌───────▼──────┐  ┌───────▼───────┐   ┌───────▼────────┐
            │  Postgres     │  │ Redis (cache/  │   │  Background     │
            │  (Supabase)   │  │  rate-limit)   │   │  workers (queue) │
            │  shard-key-   │  └────────────────┘   │  outbox consumer │
            │  ready, RLS   │                        └───────┬─────────┘
            └───────┬───────┘                                │
                    │ outbox table (events)                  │
                    └────────────────┬────────────────────────┘
                                     │ (future: real event bus)
                          ┌──────────▼───────────┐
                          │  AI layer              │
                          │  Claude API (BRO,      │  prompt caching,
                          │  Verdikt, MOSAIC, etc.)│  per-user token metering
                          └────────────────────────┘
```

## 2. Core design decisions

**Monolith-first, container-native.** One Django/DRF service, deployed as a Docker image, split into separately-scalable *processes* (web, worker, orchestrator) before it's ever split into separate *services*. This gets you Kubernetes-portability later without Kubernetes overhead now.

**Every table designed around `user_id` as the natural shard key**, today, at zero cost — not sharded, just consistently modeled so a future shard migration is mechanical instead of a rewrite.

**Outbox pattern from day one.** Every state-changing write inserts a row into an `events` table in the same transaction. No consumer needs to exist yet — this is what makes "add a real event bus later" a config change instead of an architecture change.

**Idempotency is DB-backed, not in-process.** Any POST that creates a payment, a task, or a resource requires an `Idempotency-Key` header, checked against a DB table with a unique constraint — never an in-memory `Map()`, which dies on every redeploy and doesn't work across more than one instance.

**RLS (Row-Level Security) at the database layer**, not just application-layer auth checks. This is what makes a bug like the StitchRail bypass survive even if the API layer has a hole — the database itself refuses the wrong row.

**Auth: per-service signed tokens**, not a shared static secret across integrations (github-mcp, orchestrator, etc.).

## 3. Data model shape (high-level, not full schema)

- `users`, `profiles` — one identity across Citizen, Founder, and Team Workspace surfaces
- `workspaces` — a company container; `workspace_members` join table with roles (founder/teammate/contractor)
- `payments` — **append-only ledger**: `id, user_id, workspace_id, provider, amount, currency, status, reference, created_at`. Never `UPDATE`ed; corrections are new rows.
- `subscriptions` — tier, provider_subscription_id, current_period_end
- `events` — the outbox table: `id, aggregate_type, aggregate_id, event_type, payload, created_at, processed_at`
- `issues` / `tasks` — workspace-scoped, with `escalated_at` nullable timestamp feeding the CEO escalation view
- `bro_memory_nodes` / `bro_memory_edges` — the relational knowledge graph: nodes are discrete memories, edges carry relationship + importance weight
- `skills`, `skill_vettings`, `opportunities`, `matches` — citizen marketplace + blind-match/NDA-gate flow
- `reputation` — the Start-It Passport object, computed from delivery history + vetted skills + contract history

## 4. AI layer

- Claude API as the default inference path (per your own call — infrastructure quality over model-of-the-month)
- Prompt caching on BRO's system prompt + retrieved memory context — this is the single highest-leverage cost lever available and should be built before optimizing anything else
- Per-user, per-vertical token metering from day one, feeding the founder-facing cost dashboard and your own future build-vs-buy decision on inference
- Model routing: Haiku-tier for high-volume/low-complexity exchanges (companion small talk, opportunity matching), Sonnet-tier for high-stakes reasoning (Verdikt contract analysis, MOSAIC synthesis) — same substrate, different model per call, not one model for everything

## 5. What's explicitly deferred (documented, not forgotten)

Everything in the "Impossible Proposal" Slack thread stays deferred until its own trigger metric is hit:
- Multi-region active-active — trigger: sustained latency complaints from a specific region, not before
- DB sharding — trigger: single-primary Postgres write throughput becomes the actual bottleneck (measured, not assumed)
- Real event bus (Kafka/NATS) replacing the outbox — trigger: more than one consumer needs the same event stream
- Chaos engineering — trigger: enough redundancy exists that there's something worth chaos-testing
- Self-hosted GPU/DGX — trigger: sustained AI inference cost data over 3+ months that clears the hardware payback math, **or** an NDPR data-residency requirement that forces local-only inference for a specific data class (this is the one legitimate non-cost trigger — worth actively monitoring, not the cost argument alone)

## 6. Security architecture (elaborated in the Infrastructure doc)

Auth, rate limiting, RLS, idempotency, and secrets management are treated as v1 requirements, not hardening done later — this reflects the explicit ask that "things should not be bad."
