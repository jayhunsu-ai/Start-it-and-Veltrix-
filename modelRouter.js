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
 */

const PROVIDERS = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    key: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    key: () => process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
  },
  nim: {
    baseURL: "https://integrate.api.nvidia.com/v1",
    key: () => process.env.NVIDIA_NIM_API_KEY,
    model: "nvidia/nemotron-super-120b",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    key: () => process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
};

const CHAINS = {
  FAST: ["groq", "openrouter"],
  LONGCTX: ["gemini", "nim", "openrouter"],
  QUALITY: ["nim", "gemini", "openrouter"],
};

async function callProvider(providerName, messages, temperature, keep_alive) {
  const p = PROVIDERS[providerName];
  const apiKey = p.key();
  if (!apiKey) {
    throw new Error(`NO_KEY:${providerName}`);
  }

  const res = await fetch(`${p.baseURL}/chat/completions`, {
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
    // keep_alive is a no-op for hosted providers; kept in the signature
    // for parity with Alfred's local-model call pattern.
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PROVIDER_ERROR:${providerName}:${res.status}:${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    provider: providerName,
    raw: data,
  };
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
  const errors = [];

  for (const providerName of chain) {
    try {
      const result = await callProvider(providerName, messages, temperature, keep_alive);
      return result;
    } catch (err) {
      errors.push(`${providerName}: ${err.message}`);
      // fall through to next provider in chain
    }
  }

  throw new Error(
    `All providers failed for ${taskType}. Chain: ${chain.join(" -> ")}. Errors: ${errors.join(" | ")}`
  );
}

module.exports = { call_model, PROVIDERS, CHAINS };
