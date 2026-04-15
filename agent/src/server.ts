/**
 * Nucleus agent HTTP wrapper around the Ruflo bridge.
 *
 * POST /api/v1/swarm/run  — body {job_id, candidate_spec, tools_base_url}
 *                           streams SSE events from the Ruflo bridge.
 * GET  /health            — liveness probe.
 *
 * Listens on PORT (default 9000). In docker-compose this is mapped to 9100
 * on the host so Python's RUFLO_BRIDGE_URL resolves.
 */

import express, { type Express, type Request, type Response } from "express";

import { runSwarm, type SwarmEvent, type SwarmRequest } from "./ruflo-bridge.js";

const app: Express = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/v1/swarm/run", async (req: Request, res: Response) => {
  const body = req.body as Partial<SwarmRequest>;
  if (!body.job_id || !body.candidate_spec || !body.tools_base_url) {
    res.status(400).json({
      error: "Missing required fields: job_id, candidate_spec, tools_base_url",
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const write = (event: SwarmEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    for await (const event of runSwarm(body as SwarmRequest)) {
      write(event);
    }
  } catch (err) {
    write({
      event_type: "candidate.failed",
      job_id: body.job_id,
      candidate_id: body.candidate_spec.id,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    res.end();
  }
});

const PORT = Number(process.env.PORT ?? 9000);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[nucleus-agent] listening on :${PORT}`);
  });
}

export { app };
