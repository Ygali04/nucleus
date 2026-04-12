interface DatabaseDetailProps {
  title: string;
  subtitle: string;
  statusText: string;
  metaTag?: string | null;
}

export function DatabaseDetail({
  title,
  subtitle,
  statusText,
  metaTag,
}: DatabaseDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {subtitle}
        </div>
        <h2 className="font-serif text-2xl text-[var(--color-ink)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{statusText}</p>
      </div>

      <div className="rounded-lg border border-black/8 bg-black/[0.015] px-4 py-4 text-sm text-[var(--color-muted)]">
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-brass)]">
          Persistence
        </div>
        <div>Storage namespace: {metaTag || 'default'}</div>
        <div className="mt-2">
          This node represents storage or cache infrastructure supporting the
          swarm runtime.
        </div>
      </div>
    </div>
  );
}
