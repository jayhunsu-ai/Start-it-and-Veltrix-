import { useState, useCallback } from "react";

/**
 * useToolCall — same contract as the fetch logic already proven in
 * start-it-landing.jsx's ToolCard: dual-mode (real API vs demo
 * fallback), 24s timeout matched to server worst-case, typed errors,
 * one retry-friendly status machine. Extracted here so demo.jsx uses
 * the identical logic instead of a third reimplementation.
 */

class ToolError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind; // "network" | "timeout" | "server" | "invalid_response"
  }
}

function getApiBase() {
  return typeof window !== "undefined" ? window.__STARTIT_API_BASE__ || null : null;
}

export function useToolCall(endpoint, { demoFn } = {}) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (payload) => {
      setStatus("loading");
      setError(null);

      const apiBase = getApiBase();

      // Demo mode — no backend configured, use local fallback so the
      // flow is still walkable without keys/deployment.
      if (!apiBase) {
        try {
          const demoResult = await Promise.resolve(demoFn ? demoFn(payload) : null);
          setResult(demoResult);
          setStatus("done");
          return demoResult;
        } catch (e) {
          setError(new ToolError("Demo generation failed.", "invalid_response"));
          setStatus("error");
          return null;
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 24000);

      try {
        const res = await fetch(`${apiBase}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new ToolError(body.error || "Something went wrong. Try again.", "server");
        }

        const data = await res.json();
        setResult(data);
        setStatus("done");
        return data;
      } catch (e) {
        clearTimeout(timeout);
        const toolError =
          e.name === "AbortError"
            ? new ToolError("Taking longer than expected. Try again.", "timeout")
            : e instanceof ToolError
            ? e
            : new ToolError("Couldn't reach the server. Check your connection.", "network");
        setError(toolError);
        setStatus("error");
        return null;
      }
    },
    [endpoint, demoFn]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, run, reset, isDemoMode: !getApiBase() };
}
