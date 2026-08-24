/**
 * modelRouter.js
 *
 * Multi-provider LLM routing with automatic fallback.
 * Signature intentionally matches Alfred's model_manager.call_model()
 * — (model, messages, temperature, keep_alive) — so this is portable
 * back into Alfred later with no rewrite, just a different call site.
 *
 * Chain order per task type:
 *   FAST     -> Groq -> OpenRouter
 *   LONGCTX  -> Gemini -> NVIDIA NIM -> OpenRouter
 *   QUALITY  -> NVIDIA NIM -> Gemini -> OpenRouter
 *
 * All providers are OpenAI-compatible endpoints, so one request
 * shape works across all four.
 *
 * MODEL CHOICES — verified against each provider's current docs as of
 * Aug 24, 2026, after two of the four original slugs 404'd in prod
 * (Groq deprecated its model, OpenRouter delisted its free Llama tier):
 *
 *   groq       openai/gpt-oss-120b
 *              Not the 20b I picked initially — checked Groq's free-tier
 *              limits and 120b/20b share the EXACT same free allowance
 *              (30 RPM/1K RPD/8K TPM/200K TPD), so there's no cost to
 *              the bigger, smarter model. Groq's own docs put 120b ahead
 *              of OpenAI's o4-mini on several benchmarks, and it still
 *              runs ~500 tok/s on their LPU hardware — for a few hundred
 *              tokens of JSON output, that's under a second either way.
 *
 *   gemini     gemini-3.7-flash
 *              Google's own current OpenAI-compatibility quickstart
 *              example. gemini-2.5-flash (the old value here) is now
 *              explicitly labelled "legacy" in Google's docs — still
 *              works today, just first in line for the same fate as Groq's.
 *
 *   nim        nvidia/llama-3.3-nemotron-super-49b-v1.5
 *              Confirmed live on the hosted free endpoint (not a
 *              download-only container). Deliberately NOT using the
 *              newer, bigger Nemotron 3 Ultra (550B, benchmarks better on
 *              paper) — multiple NVIDIA developer forum threads from the
 *              last two weeks report 401/403 errors calling it on the
 *              standard hosted endpoint: it's listed in /v1/models but
 *              not actually invokable on a regular free key yet. Best
 *              spec sheet, broken in practice — the older, less flashy
 *              49B has zero such reports and known-working examples.
 *
 *   openrouter openrouter/free
 *              NOT a specific model — this is OpenRouter's own Free
 *              Models Router. It picks a live free model per-request and
 *              tells you which one it used (see the `provider` field
 *              tools.js could log if useful later). This is the actual
 *              fix for the churn problem, not just a fresher slug:
 *              OpenRouter's free lineup has been shedding models weekly
 *              ("eight delisted in recent weeks" per current reporting).
 *              A hardcoded :free slug is a when-not-if 404. Since
 *              OpenRouter only ever sits last in every chain here, it's
 *              already the "something, anything, please" fallback —
 *              openrouter/free formalizes that instead of fighting it.
 *
 * All four of these are still verify-before-you-trust: free-tier model
 * lineups are the least stable part of this whole system. If a chain
 * starts failing again, re-check the provider's docs before assuming
 * it's a bug in this file.
 */

const PROVIDERS = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    key: () => process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    key: () => process.env.GEMINI_API_KEY,
    model: "gemini-3.7-flash",
  },
  nim: {
    baseURL: "https://integrate.api.nvidia.com/v1",
    key: () => process.env.NVIDIA_NIM_API_KEY,
    model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    key: () => process.env.OPENROUTER_API_KEY,
    model: "openrouter/free",
  },
};

const CHAINS = {
  FAST: ["groq", "openrouter"],
  LONGCTX: ["gemini", "nim", "openrouter"],
  QUALITY: ["nim", "gemini", "openrouter"],
};

// Typed errors so callers (tools.js) can map to the right HTTP status /
// user-facing message instead of grepping a string. A senior-grade router
// never leaves error classification as string parsing on the call site.
class ProviderError extends Error {
  constructor(kind, provider, detail) {
    super(`${kind}:${provider}:${detail || ""}`);
    this.kind = kind; // "no_key" | "timeout" | "network" | "rate_limited" | "http_error" | "bad_response"
    this.provider = provider;
  }
}

// Per-provider timeout. Budgeted against the frontend's fetch timeout
// (see start-it-landing.jsx: 30s) — worst case is the longest chain
// (LONGCTX/QUALITY, 3 providers) all timing out back-to-back:
// 3 x 8s = 24s, leaving ~6s of headroom under the client's abort at 30s.
// If you lengthen a chain or raise this value, raise the client timeout
// to match — a mismatch here is exactly what produces a stuck spinner
// on the frontend (client gives up silently while the server is still
// working, or the server is still "trying" long after the user saw an
// error and clicked retry, now racing a second in-flight request against
// the first for the same cache key — see cache.js's in-flight coalescing,
// which is the actual guard against that).
const PROVIDER_TIMEOUT_MS = 8000;

async function callProvider(providerName, messages, temperature, keep_alive) {
  const p = PROVIDERS[providerName];
  const apiKey = p.key();
  if (!apiKey) {
    throw new ProviderError("no_key", providerName);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${p.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: p.model,
        messages,
        temperature: temperature ?? 0.7,
      }),
      signal: controller.signal,
      // keep_alive is a no-op for hosted providers; kept in the signature
      // for parity with Alfred's local-model call pattern.
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ProviderError("timeout", providerName, `no response in ${PROVIDER_TIMEOUT_MS}ms`);
    }
    throw new ProviderError("network", providerName, err.message);
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 429) {
    throw new ProviderError("rate_limited", providerName, "429 from provider");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderError("http_error", providerName, `${res.status}:${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.length) {
    throw new ProviderError("bad_response", providerName, "empty completion");
  }

  return { text, provider: providerName, raw: data };
}

/**
 * call_model — the single entry point every tool/route should use.
 *
 * @param {"FAST"|"LONGCTX"|"QUALITY"} taskType
 * @param {Array<{role:string, content:string}>} messages
 * @param {number} [temperature]
 * @param {boolean} [keep_alive]
 */
async function call_model(taskType, messages, temperature = 0.7, keep_alive = false) {
  const chain = CHAINS[taskType] || CHAINS.FAST;
  const failures = []; // [{ provider, kind }]

  for (const providerName of chain) {
    try {
      return await callProvider(providerName, messages, temperature, keep_alive);
    } catch (err) {
      failures.push({ provider: providerName, kind: err.kind || "unknown" });
      // fall through to next provider in chain
    }
  }

  // Every provider in the chain failed — classify the aggregate so the
  // route layer can pick the right HTTP status instead of always 502:
  //  - every failure was "rate_limited" -> the caller should back off, not retry-loop
  //  - every failure was "no_key"        -> a config problem, not a runtime one
  //  - anything mixed / other            -> generic upstream failure
  const kinds = new Set(failures.map((f) => f.kind));
  const allChainFailure =
    kinds.size === 1 && kinds.has("rate_limited")
      ? "all_rate_limited"
      : kinds.size === 1 && kinds.has("no_key")
      ? "all_unconfigured"
      : "all_failed";

  const err = new Error(
    `All providers failed for ${taskType}. Chain: ${chain.join(" -> ")}. ` +
      failures.map((f) => `${f.provider}(${f.kind})`).join(" | ")
  );
  err.kind = allChainFailure;
  err.failures = failures;
  throw err;
}

module.exports = { call_model, PROVIDERS, CHAINS, ProviderError };
