/**
 * Nucleus Render API - HTTP server that accepts render requests.
 *
 * POST /render
 * Body: { compositionId: string, props: SceneManifest, outputPath: string }
 * Response: { success: boolean, outputPath: string, durationMs: number }
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const PORT = Number(process.env.RENDER_PORT) || 8089;

const VALID_COMPOSITIONS = [
  'DemoArchetype',
  'MarketingArchetype',
  'KnowledgeArchetype',
  'EducationArchetype',
];

// Cache the bundle so we don't re-bundle on every request
let bundleLocationCache: string | null = null;
async function getBundleLocation(): Promise<string> {
  if (!bundleLocationCache) {
    const entryPoint = path.resolve(__dirname, 'index.ts');
    bundleLocationCache = await bundle({ entryPoint });
  }
  return bundleLocationCache;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true });
  }

  if (req.method !== 'POST' || req.url !== '/render') {
    return json(res, 404, { error: 'Not found. Use POST /render.' });
  }

  let body: { compositionId?: string; props?: Record<string, unknown>; outputPath?: string };
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const { compositionId, props, outputPath } = body;

  if (!compositionId || !VALID_COMPOSITIONS.includes(compositionId)) {
    return json(res, 400, {
      error: `compositionId must be one of: ${VALID_COMPOSITIONS.join(', ')}`,
    });
  }

  const resolvedOutput = outputPath ?? `out/${compositionId}-${Date.now()}.mp4`;
  const startMs = Date.now();

  try {
    const bundleLocation = await getBundleLocation();

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: props ?? {},
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: path.resolve(resolvedOutput),
      inputProps: props ?? {},
    });

    const durationMs = Date.now() - startMs;
    return json(res, 200, { success: true, outputPath: resolvedOutput, durationMs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json(res, 500, { success: false, error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Nucleus render API listening on http://localhost:${PORT}`);
  console.log('POST /render  — render a composition');
  console.log('GET  /health  — health check');
});
