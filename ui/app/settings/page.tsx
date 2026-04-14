'use client';

const PROVIDER_ROWS: Array<{ label: string; description: string; envVar: string }> = [
  {
    label: 'fal.ai',
    description: 'Kling 3.0 + Seedance video generation',
    envVar: 'FAL_KEY',
  },
  {
    label: 'WaveSpeedAI',
    description: 'MagiHuman avatar generation',
    envVar: 'WAVESPEED_API_KEY',
  },
  {
    label: 'ElevenLabs',
    description: 'Voice cloning + TTS',
    envVar: 'ELEVENLABS_API_KEY',
  },
  {
    label: 'Google Cloud (Vertex AI)',
    description: 'Lyria music generation',
    envVar: 'GOOGLE_CLOUD_PROJECT',
  },
  {
    label: 'NeuroPeer',
    description: 'Neural scoring API',
    envVar: 'NEUROPEER_BASE_URL',
  },
];

const INFRA_ROWS: Array<{ label: string; value: string }> = [
  {
    label: 'Nucleus API',
    value: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  },
  {
    label: 'Ruflo bridge',
    value: process.env.NEXT_PUBLIC_RUFLO_URL ?? 'http://localhost:9100',
  },
  {
    label: 'Remotion render',
    value: process.env.NEXT_PUBLIC_REMOTION_URL ?? 'http://localhost:3101',
  },
  {
    label: 'MinIO / S3',
    value: process.env.NEXT_PUBLIC_S3_ENDPOINT ?? 'http://localhost:9000',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Settings
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Nucleus Configuration
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          Provider keys and local infrastructure endpoints. Keys are read
          server-side from environment variables — this view confirms which
          services are wired.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="gs-card rounded-2xl p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Model providers
          </div>
          <div className="space-y-3">
            {PROVIDER_ROWS.map((row) => (
              <div
                key={row.envVar}
                className="flex items-start justify-between gap-4 rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-[var(--color-ink)]">
                    {row.label}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {row.description}
                  </div>
                </div>
                <code className="rounded-md bg-black/[0.04] px-2 py-1 font-mono text-[10px] text-[var(--color-muted)]">
                  {row.envVar}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div className="gs-card rounded-2xl p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Local infrastructure
          </div>
          <div className="space-y-3">
            {INFRA_ROWS.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3 text-sm"
              >
                <span className="text-[var(--color-muted)]">{row.label}</span>
                <code className="truncate font-mono text-[11px] text-[var(--color-ink)]">
                  {row.value}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div className="gs-card rounded-2xl p-5 xl:col-span-2">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Execution defaults
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Row label="Mock mode" value="NUCLEUS_MOCK_PROVIDERS=true" />
            <Row label="Neural threshold" value="72" />
            <Row label="Max iterations per candidate" value="8" />
            <Row label="Cost ceiling per job" value="$5.00" />
            <Row label="Progressive mock score start" value="45" />
            <Row label="Event retention (client)" value="10 000 events" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-xs text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  );
}
