/**
 * Minimal `defineTool` primitive compatible with Ruflo v3's
 * tool-registry contract (`ruflo/v3/@claude-flow/shared/src/mcp/tool-registry.ts`).
 *
 * This is intentionally thin: each handler is an async JS function that
 * receives a typed input and returns a typed output. The Ruflo bridge
 * registers these handlers with the swarm coordinator (or invokes them
 * directly in the in-process fallback).
 */

export interface ToolDefinition<I = unknown, O = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: I) => Promise<O>;
}

export function defineTool<I, O>(
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  handler: (input: I) => Promise<O>,
): ToolDefinition<I, O> {
  return { name, description, inputSchema, handler };
}

/**
 * Build a handler that POSTs its input to `${toolsBaseUrl}/api/v1/tools/{name}`
 * and returns the JSON response. This is the default implementation used by
 * every Nucleus tool: Ruflo orchestrates, Python executes.
 */
export function httpToolHandler<I, O>(
  name: string,
  toolsBaseUrl: string,
): (input: I) => Promise<O> {
  const url = `${toolsBaseUrl.replace(/\/$/, "")}/api/v1/tools/${name}`;
  return async (input: I): Promise<O> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Tool ${name} failed: ${res.status} ${body}`);
    }
    return (await res.json()) as O;
  };
}
