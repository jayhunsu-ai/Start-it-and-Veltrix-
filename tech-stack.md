# Tech Stack — Start-It / BRO / Veltrix

Chosen for one thing above all: **you can operate this alone.** Every choice below is a technology you already know, already use elsewhere in your portfolio, or that removes an entire operational category rather than adding one. "Boring technology" per your own guidelines doc — the differentiation lives in Brain/BRO's substrate, not in exotic infrastructure choices.

## Backend
- **Django + Django REST Framework (Python)** — consistent with Sunflower and Crypto Signals; you already know this stack cold, which matters more than any theoretical framework advantage
- **PostgreSQL via Supabase** — managed, includes auth, storage, and RLS out of the box
- **Celery + Redis** — background jobs, outbox consumer, scheduled tasks (compliance calendar reminders, reconciliation jobs)

## Frontend
- **Next.js (React)** — web app, both citizen and founder dashboards
- **React Native (Expo)** — mobile, shared component logic with web where practical
- **Tauri (Rust)** — desktop client, already your stack for other tools; far lighter than Electron, which matters for the "not hanging" requirement

## AI layer
- **Anthropic Claude API** — primary inference for BRO, Verdikt, MOSAIC, GridPulse's synthesis layer
- Model routing by task: Haiku-tier for volume, Sonnet-tier for reasoning-heavy work (see System Design §4)
- Local/open-weight models (Qwen, per your existing fine-tuning work) stay in Alfred's personal/internal use — not the citizen-facing product path unless the NDPR trigger in System Design §5 is hit

## Media / content
- **Jellyfin** — self-hosted video library for generated/posted content (already in the Alfred plan)
- **Immich** — self-hosted photo/visual library with face/object/CLIP search (already in the Alfred plan)
- **Cloudflare R2** — object storage for user uploads; no egress fee, which matters given Nigerian bandwidth costs

## Payments
- **Paystack** (primary), **Flutterwave** (fallback) — card/bank rails
- **Coinbase Commerce** (or equivalent) — crypto rail, gated on SEC-VASP/NDPR compliance review
- All three write through the same append-only ledger table — one reconciliation path, not three

## Communications
- **Termii** (or equivalent Nigerian SMS aggregator) — OTP and BRO's offline SMS fallback mode; better local delivery rates than Twilio for Nigerian carriers
- **WhatsApp Business API** — Verdikt's negotiation-agent moonshot, general notifications

## Infrastructure & DevOps
- **Docker** — every service containerized from day one (this is the actual "built for millions" decision — not Kubernetes itself, but never being locked out of it)
- **Render** (or Railway, already connected) — managed hosting today; both deploy from a Dockerfile, so switching between them, or later moving to AWS ECS/EKS or GCP Cloud Run/GKE, is a redeploy, not a rewrite
- **GitHub Actions** — CI, including the RLS/auth regression suite
- **Cloudflare** — CDN, WAF, DDoS protection, DNS

## Observability & security tooling
- **Sentry** (already connected) — error tracking, alerting
- **Doppler or Infisical** — secrets management, replacing `.env` files
- **Snyk / GitHub Advanced Security** — dependency and vulnerability scanning

## Explicitly not adopted (for now)
- **Kubernetes** — deferred until Docker-native scaling on Render/Railway genuinely runs out, per System Design §5
- **Self-hosted GPU/DGX hardware** — deferred per the same trigger logic; API-based inference for now, matching your own stated call
- **Kafka/NATS event bus** — the outbox table stands in until more than one real consumer needs the stream
