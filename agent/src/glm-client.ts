/**
 * GLM / OpenRouter chat client.
 *
 * Thin OpenAI-compatible wrapper around OpenRouter (or any compatible
 * upstream) used by the Ruflo bridge for Ruflo's "brain" calls — initial
 * description -> starter graph translation, chat routing, and the
 * closed-loop iteration decisions.
 *
 * Configuration (env):
 *   GLM_KEY              — OpenRouter / GLM API key (required to call out)
 *   GLM_BASE_URL         — default https://openrouter.ai/api/v1
 *   GLM_MODEL            — default z-ai/glm-4.6-flash (4.7 not yet on OR)
 *   GLM_TIMEOUT_MS       — default 30000
 *
 * The client deliberately has no retries / streaming — Ruflo calls it
 * once per decision and the bridge handles fallback on failure.
 */
export interface GlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GlmCallOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: "json" | "text";
}

export interface GlmClient {
  callGLM(
    systemPrompt: string,
    messages: GlmMessage[],
    opts?: GlmCallOptions,
  ): Promise<string>;
}

export const DEFAULT_GLM_MODEL = "z-ai/glm-4.6-flash";
export const DEFAULT_GLM_BASE_URL = "https://openrouter.ai/api/v1";

export class GlmUnavailableError extends Error {
  constructor(reason: string) {
    super(`GLM unavailable: ${reason}`);
    this.name = "GlmUnavailableError";
  }
}

/**
 * Build a default client reading from env. Returns `null` if GLM_KEY is
 * unset — callers should treat a null client as "skip GLM, use fallback".
 */
export function createGlmClient(env: NodeJS.ProcessEnv = process.env): GlmClient | null {
  const apiKey = env.GLM_KEY ?? env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const baseUrl = env.GLM_BASE_URL ?? DEFAULT_GLM_BASE_URL;
  const defaultModel = env.GLM_MODEL ?? DEFAULT_GLM_MODEL;
  const timeoutMs = Number(env.GLM_TIMEOUT_MS ?? 30000);

  return {
    async callGLM(systemPrompt, messages, opts = {}) {
      const model = opts.model ?? defaultModel;
      const body: Record<string, unknown> = {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 2048,
      };
      if (opts.responseFormat === "json") {
        body.response_format = { type: "json_object" };
      }

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": env.GLM_REFERER ?? "https://nucleus.local",
            "X-Title": env.GLM_TITLE ?? "Nucleus Ruflo",
          },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
      } catch (err) {
        throw new GlmUnavailableError(
          err instanceof Error ? err.message : String(err),
        );
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new GlmUnavailableError(`${res.status} ${text.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new GlmUnavailableError("no content in response");
      }
      return content;
    },
  };
}

/**
 * Parse a GLM JSON response tolerantly — strips ```json fences and
 * surrounding prose before JSON.parse. Throws on unrecoverable garbage.
 */
export function parseGlmJson<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  // Fast path
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as T;
  }
  // Strip ```json ... ``` fence
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fence?.[1]) {
    return JSON.parse(fence[1].trim()) as T;
  }
  // Fall back: extract first {...} or [...] block
  const objStart = trimmed.indexOf("{");
  const arrStart = trimmed.indexOf("[");
  const start = objStart === -1
    ? arrStart
    : arrStart === -1
      ? objStart
      : Math.min(objStart, arrStart);
  if (start === -1) {
    throw new Error("no JSON object/array in GLM response");
  }
  const closer = trimmed[start] === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(closer);
  if (end <= start) {
    throw new Error("unbalanced JSON in GLM response");
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as T;
}
