# Addendum: Capacity Model & Insider-Threat Architecture
*Supplement to AI-Powered Online Examination Platform — Architecture & Meeting Prep*

---

## Part 1: Back-of-Envelope Capacity Model

**Purpose:** turn "design for 200,000 concurrent sessions" into numbers you can defend in the room. All figures are stated assumptions — flag them as assumptions in the meeting and ask which ones the client can confirm or correct. The exercise matters more than the exact numbers: it shows you've actually sized the problem instead of reciting principles.

### Assumptions (state these explicitly, invite correction)
- 200,000 concurrent active exam sessions
- Exam duration: 2 hours
- Candidates start within a 10-minute login/auth window before the exam
- Question set loads within a 60-second window after auth
- Submission window clusters in the final 2 minutes before hard exam close
- Each candidate's client sends a heartbeat/state-sync every 15s, and an answer-save event roughly every 30s
- Proctoring: local CV, sends structured events on state changes; treat continuous "all clear" heartbeats separately from anomaly events

### Steady-state traffic (during the exam, not at start/end)
| Source | Calculation | Result |
|---|---|---|
| Heartbeat/sync | 200,000 / 15s | ~13,300 RPS |
| Answer autosave | 200,000 / 30s | ~6,700 RPS |
| Proctoring baseline events | assume 5% of candidates flag something per minute | ~170 RPS |
| **Steady-state total** | | **~20,000 RPS sustained**, before spikes |

This alone rules out any design where a single Postgres primary takes raw writes for heartbeats — that traffic needs to be absorbed by Redis and/or batched, not written synchronously to the transactional store.

### Login storm
- 200,000 auths in a 10-minute window → ~333 RPS average, but if realistically compressed into the last 5 minutes as people wait until the last moment → **~670 RPS**
- The trap: this looks low, but auth is CPU-heavy (bcrypt/argon2 hashing, MFA verification). A bcrypt cost factor of 12 does roughly 50–100 hashes/sec per core. 670 RPS sustained needs on the order of **10–15 dedicated cores** just for password hashing, before MFA and session issuance. This is the kind of number that gets missed because "670 requests a second" sounds trivial until you know what's inside the request.

### Question-load burst
- 200,000 candidates pulling question sets in a 60s synchronized window → **~3,300 RPS**
- Bandwidth, not just RPS, is the real constraint here: if a question set (text + diagrams/images) is ~1MB, that's **~200GB of egress in 60 seconds**. This is a CDN/edge-caching problem, not an application-server problem. Ask whether question media can be pre-cached/pre-fetched before the exam start signal rather than pulled live.

### Submission storm (the hardest number in the whole design)
- If 200,000 candidates submit within the final 2 minutes → **~1,700 RPS of durable, idempotent writes**, each requiring an idempotency-key check plus a persisted transactional record
- This is the number to lead with when someone downplays "just handle 200k users." A generic write-heavy Postgres table at ~1,700 TPS with idempotency lookups will need connection pooling (pgbouncer), write batching, and possibly a queue in front of the DB (accept + ack immediately, persist async) rather than a naive synchronous submit endpoint.

### Fallback server-side CV (if it's ever needed)
This is the number nobody in the room will have thought about, and it's the one that kills budgets.
- If even 10% of candidates fall back to server-side CV (older devices, thermal throttling, unsupported OS) at 1 sampled frame/sec → 20,000 candidates × 1fps = **20,000 frames/sec** needing inference
- A single GPU running a lightweight detector might handle a few hundred fps → **50–100 GPUs** just for the fallback path
- **This is a direct question to ask:** "What percentage of candidates are expected to need server-side fallback, and does Galaxy Backbone provide GPU capacity, or does that need to be procured separately?" If the answer is vague, that's a budget risk, not just a technical one.

### Database connections
- Do not let 20,000+ RPS translate into 20,000 raw Postgres connections — Postgres degrades well before that. Use pgbouncer/pgpool in transaction-pooling mode; target **a few hundred actual DB connections** behind a pooler regardless of app-tier scale.

### What to say if asked "will it work" without a load test
Don't. Say: *"These are first-pass estimates — steady state around 20k RPS, submission burst around 1,700 write TPS, login burst needing dedicated hashing capacity. Before I'd commit to 200,000 concurrent, I'd want to run this exact load profile against a staging environment sized like production, including database failover and Redis failure injection."* That's a stronger answer than either false confidence or vague hand-waving.

---

## Part 2: Insider-Threat & Item-Bank Security

The original architecture is entirely candidate-side threat modeling (phone detection, second person, tab switching). For a government-scale exam system, **the historically dominant failure mode in Nigeria and similar contexts has been leaks and insider collusion, not candidates sneaking phones into frame.** If this is a government body, expect this to come up, and silence here will read as a gap by anyone who's followed WAEC/JAMB/NECO incidents.

### Item-bank protection
- **Encrypt the question bank at rest**, with decryption keys released only at exam start time (time-locked key release), not stored decrypted on any server in advance
- **Algorithmic paper assembly**: generate per-candidate or per-cohort question pools from a larger item bank rather than distributing one fixed paper to everyone. A single leaked paper is far less damaging if it only represents one variant among thousands
- **Per-candidate watermarking**: subtle, traceable variations (option ordering, distractor phrasing, invisible metadata) so that if a paper leaks, you can trace which candidate/session it came from
- **Access logging on the item bank specifically** — not just general admin audit logs. Who read which questions, when, from where. This is a distinct log stream from "who changed a permission"

### Segregation of duties
- Question authors should not have production database access
- Proctors/reviewers should not have item-bank access
- No single privileged role should be able to both **view unreleased exam content** and **modify candidate records** — these must be different people or require dual authorization
- Background-check and access-review requirements for anyone with item-bank or evidence-review privileges should be an explicit, named requirement in the security section, not implied

### Proctor/reviewer collusion controls
- **Four-eyes principle on flag resolution**: a single proctor/reviewer should not be able to unilaterally clear a serious cheating flag on a high-stakes exam. Require a second reviewer or supervisor sign-off above a severity threshold
- Randomize which reviewer sees which flagged case where feasible, to reduce the ability to pre-arrange "I'll review my friend's case"
- Log every evidence access (who viewed which candidate's proctoring footage/snapshots, when) as its own auditable, retained event

### Post-exam statistical integrity checks
This is worth proposing as a genuine value-add, separate from real-time proctoring:
- Answer-pattern clustering analysis across candidates (identical wrong-answer patterns, statistically improbable score jumps, seating/location correlation) — this is how large-scale collusion and leaks are actually caught after the fact in real exam-integrity systems, and it's a relatively cheap addition (it's a batch analytics job, not a new subsystem)
- Score-distribution anomaly detection by exam center — flags centers worth investigating even when no individual candidate triggered a real-time alert

### Data protection / regulatory
- Explicitly reference **NDPR (Nigeria Data Protection Regulation)** compliance for biometric/proctoring data — this is likely to be asked about directly in a government meeting and its absence from the original doc is a gap
- Face/gaze detection models have documented accuracy degradation across skin tones — worth naming this proactively as a fairness/liability consideration and stating that any AI flag should require human confirmation before consequence, never auto-penalize on AI signal alone

---

## One-line versions to have ready verbally

- **On capacity:** "Steady state is roughly 20,000 requests per second, but the number that actually matters is the submission burst — about 1,700 durable writes per second in the final two minutes, and that's what has to be idempotent and queued, not synchronous."
- **On insider threat:** "The candidate-side proctoring is necessary but not sufficient — the historical failure mode for exams at this scale has been leaks and insider access, so item-bank encryption, segregation of duties, and dual-control on flag resolution need to be in scope from day one, not added after an incident."
