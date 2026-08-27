# Infrastructure — Start-It / BRO / Veltrix

## 1. Hosting decision: Render/Railway now, portable by design

You don't need Kubernetes to be "architected for millions" — you need to never be locked out of it. That's achieved by:
- Every service ships as a Dockerfile, no platform-specific glue code
- No local filesystem state (all state in Postgres/Redis/R2) — this alone is what makes horizontal scaling and provider migration possible without a rewrite
- 12-factor config (env vars via secrets manager, not hardcoded)

Render and Railway both deploy Docker images directly from GitHub — moving between them, or later to AWS ECS/Fargate or GKE Autopilot (managed Kubernetes with far less operational burden than raw K8s), is a redeploy exercise once the above is true. **Kubernetes itself gets built when a real trigger hits** (see System Design §5) — not before, because operating a cluster alone, on top of everything else, is how good infrastructure plans die from founder burnout instead of bad architecture.

## 2. Compute scaling path

| Stage | Users | Setup |
|---|---|---|
| Now | ~5,000 | Render/Railway Standard instances, 3–4 processes (API, worker, orchestrator, frontend) |
| Next | ~50,000 | Same platform, Pro-tier instances, read replica on Postgres, Redis cluster |
| Later | ~500,000+ | Evaluate managed Kubernetes (GKE Autopilot/EKS) if service count and team size justify the operational cost; DB sharding by `user_id` (already designed for) |
| Hyperscale | Millions | Multi-region, real event bus, the full "Impossible Proposal" list — each item individually triggered, not adopted as a package |

## 3. AI inference — the cost and hardware question, answered directly

At 5,000 users: **$1,500–$4,500/month on cloud APIs** (see the earlier cost estimate doc). At 50,000 users, scale that roughly linearly, minus whatever prompt caching claws back.

**On the DGX Stations specifically:** 2–3 units at ~$40k each is $80k–$120k of capital, plus power, cooling, and someone maintaining GPU health and driver updates — a real operational burden for a team of one, and exactly the kind of single-point-of-failure your own guidelines doc's bus-factor warning is about, just in hardware instead of code. At current and near-term usage, cloud API cost is far below the amortized cost of that hardware. **Don't buy it now.**

Buy it (or rent dedicated GPU capacity as a middle step) only when one of these is true:
- Sustained AI inference spend, measured over 3+ months, clearly exceeds what the hardware would cost amortized over its useful life — a real number, not a projection
- NDPR or another compliance requirement forces certain data (health-adjacent signals, companion conversations) to be processed on infrastructure that never leaves Nigeria or never touches a foreign cloud API — this is a legitimate trigger independent of cost, and worth actively tracking as the product matures, since BRO's emotional-presence data is exactly the kind of thing this could apply to

If/when that trigger hits, a rented GPU instance (~$300–1,500/month) is the correct middle step before a six-figure hardware purchase — same logic as containers-before-Kubernetes.

## 4. Security posture

### Application layer
- Auth on every route, including internal tool/orchestrator endpoints — no endpoint trusts an unauthenticated caller, including "internal-only" ones (this is the exact class of the StitchRail bug)
- Idempotency keys, DB-backed, on every side-effecting POST
- Rate limiting on every public endpoint before it's marketing-page-visible
- Input validation and output encoding as a matter of course, not per-feature judgment calls

### Data layer
- RLS policies on every table containing user data, tested in CI as a regression suite — this is what stops the *next* auth bug from becoming a data breach even if the app-layer check has a gap
- Append-only ledger for all payment data — no destructive updates, full audit trail by construction
- Encryption at rest (Supabase default) and in transit (TLS everywhere, via Cloudflare)

### Network / edge
- Cloudflare WAF + DDoS protection in front of every public-facing service
- Per-service signed tokens for internal service-to-service auth, not a shared static secret

### Secrets & credentials
- Doppler/Infisical for secrets management — no `.env` files in git, no secrets in Slack/chat history
- Rotate any credential that has ever been exposed in a log, chat, or commit, on discovery — not "eventually"

### Process
- ADR (Architecture Decision Record) for every non-trivial infra or architecture decision, starting now
- Staging environment mirrors production configuration exactly, at a fraction of the cost, before any change touches real users
- External penetration test scheduled before real payment volume goes live — a one-time ~$3,000–$8,000 spend, non-negotiable given Verdikt handles contracts and the platform handles money

## 5. Payments infrastructure specifically

- Paystack primary, Flutterwave fallback, Coinbase Commerce (or equivalent) for crypto — all three write to one append-only `payments` ledger
- Webhook handlers verify signatures against the raw request body (not the parsed JSON) to prevent forgery
- A reconciliation job polls provider status against the local ledger on a schedule — catches silent webhook failures before a user notices a missing payment

## 6. What triggers the next infrastructure investment (so nobody has to guess)

| Signal | Response |
|---|---|
| Postgres write latency degrades under real load | Read replica, then sharding by `user_id` |
| More than one service needs the same event stream | Real event bus (Kafka/NATS) replaces the outbox |
| Sustained multi-thousand-dollar/month AI spend over 3+ months, with committed revenue to amortize hardware | Evaluate dedicated GPU (rented first, purchased only if that also pencils out) |
| NDPR forces local-only processing for a specific data class | Local inference for that data class specifically, not a wholesale infrastructure change |
| Region-specific latency complaints, sustained | Multi-region deployment for that region |
| Team grows past what one person can operate | Managed Kubernetes (GKE Autopilot/EKS), not raw self-managed K8s |

This table exists so that "should we build X" has an answer that isn't a feeling — it's a number that either exists yet or doesn't.
