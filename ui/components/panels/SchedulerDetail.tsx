interface SchedulerDetailProps {
  title: string;
  statusText: string;
  metaTag?: string | null;
}

export function SchedulerDetail({
  title,
  statusText,
  metaTag,
}: SchedulerDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Scheduler
        </div>
        <h2 className="font-serif text-2xl text-[var(--color-ink)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{statusText}</p>
      </div>

      <div className="rounded-lg border border-black/8 bg-black/[0.015] px-4 py-4 text-sm text-[var(--color-muted)]">
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Schedule
        </div>
        <div>Current cadence: {metaTag || 'unspecified'}</div>
        <div className="mt-2">
          Schedulers trigger recurring ingestion, reporting, and orchestration
          workflows.
        </div>
      </div>
    </div>
  );
}
