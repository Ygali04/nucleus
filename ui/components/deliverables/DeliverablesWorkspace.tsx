'use client';

import { useMemo } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useDashboardStore } from '@/store/dashboard-store';

type DeliverablesSurface = 'provider' | 'client' | 'executive';

interface DeliverablesWorkspaceProps {
  surface: DeliverablesSurface;
}

function formatDuration(start: string, end?: string) {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end || start).getTime();
  const minutes = Math.max(1, Math.round((endTime - startTime) / 60000));
  return formatMinutes(minutes);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function buildInsightSummary(title: string, result?: string) {
  if (result && result !== 'Task completed successfully with updated report artifact.') {
    return result;
  }

  const lower = title.toLowerCase();
  if (lower.includes('pricing')) {
    return 'Pricing variance concentrated in two regions; recommended next move is a targeted discount-governance review and weekly leakage monitoring.';
  }
  if (lower.includes('inventory') || lower.includes('working capital')) {
    return 'Working-capital friction is concentrated in slower-moving business units; the swarm recommended reorder threshold changes and a short-cycle inventory review.';
  }
  if (lower.includes('vendor') || lower.includes('supplier')) {
    return 'Supplier concentration risk remains elevated; the swarm surfaced renegotiation leverage and an alternate-vendor shortlist for procurement follow-up.';
  }
  if (lower.includes('ebitda') || lower.includes('sg&a') || lower.includes('cash')) {
    return 'The analysis identified a near-term earnings and cash unlock path, with the strongest actions tied to spend controls, reporting hygiene, and faster operational escalation.';
  }

  return 'The consulting swarm completed this analysis, captured the supporting evidence, and produced an operator-ready recommendation set for the next review cycle.';
}

function getCopy(surface: DeliverablesSurface) {
  if (surface === 'provider') {
    return {
      eyebrow: 'Deliverables',
      title: 'Client-Facing Insights and Outcomes',
      description:
        'Review the outputs your consulting swarm is producing across client workstreams, including final recommendations, delivery timing, and share-ready report links.',
      summaryThreeLabel: 'Client Messages',
    };
  }

  if (surface === 'executive') {
    return {
      eyebrow: 'Executive Workspace',
      title: 'Deliverable History and Sharing',
      description:
        'A narrow executive surface for reviewing completed deliverables, understanding time-to-deliver, and sharing report links with other stakeholders.',
      summaryThreeLabel: 'Recent Client Messages',
    };
  }

  return {
    eyebrow: 'Deliverables',
    title: 'Insights and Outcomes',
    description:
      'Review the reports, conclusions, and recommendations the consulting swarm has produced for this project, along with delivery timing and share links.',
    summaryThreeLabel: 'Project Messages',
  };
}

export function DeliverablesWorkspace({
  surface,
}: DeliverablesWorkspaceProps) {
  useTasks();
  useMessages();

  const tasks = useDashboardStore((state) => state.tasks);
  const messages = useDashboardStore((state) => state.messages);
  const copy = getCopy(surface);

  const deliverables = useMemo(
    () =>
      tasks
        .filter((task) => task.status === 'completed')
        .slice()
        .sort((a, b) => {
          const aTime = new Date(a.completed_at || a.created_at).getTime();
          const bTime = new Date(b.completed_at || b.created_at).getTime();
          return bTime - aTime;
        })
        .map((task) => ({
          id: task.id,
          title: task.title,
          deliveredAt: task.completed_at || task.created_at,
          createdAt: task.created_at,
          cycleTime: formatDuration(task.created_at, task.completed_at),
          summary: buildInsightSummary(task.title, task.result),
          shareUrl: `https://share.nucleus-pipeline.ai/deliverables/${task.id}`,
        })),
    [tasks],
  );

  const averageCycleTime = useMemo(() => {
    if (deliverables.length === 0) return 'n/a';
    const totalMinutes = deliverables.reduce((total, deliverable) => {
      const start = new Date(deliverable.createdAt).getTime();
      const end = new Date(deliverable.deliveredAt).getTime();
      return total + Math.max(1, Math.round((end - start) / 60000));
    }, 0);
    return formatMinutes(
      Math.round(totalMinutes / Math.max(deliverables.length, 1)),
    );
  }, [deliverables]);

  const latestDeliveredAt = deliverables[0]
    ? new Date(deliverables[0].deliveredAt).toLocaleString()
    : 'No deliverables yet';

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {copy.eyebrow}
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          {copy.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Reports Delivered"
          value={String(deliverables.length)}
        />
        <SummaryCard label="Average Cycle Time" value={averageCycleTime} />
        <SummaryCard
          label={copy.summaryThreeLabel}
          value={String(messages.length)}
        />
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.6fr,1fr]">
        <div className="gs-card rounded-2xl p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
            Deliverable History
          </div>
          <div className="space-y-3">
            {deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="rounded-xl border border-black/8 bg-black/[0.015] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-ink)]">
                      {deliverable.title}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      Delivered {new Date(deliverable.deliveredAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-full border border-[var(--color-brass)]/30 bg-[var(--color-brass)]/10 px-3 py-1 text-xs text-[var(--color-ink)]">
                    Cycle time {deliverable.cycleTime}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {deliverable.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                    Open report
                  </button>
                  <button className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                    Copy share link
                  </button>
                  <span className="truncate rounded-md bg-black/[0.03] px-3 py-1.5 text-xs text-[var(--color-muted)]">
                    {deliverable.shareUrl}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gs-card rounded-2xl p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
            Sharing
          </div>
          <div className="space-y-3 text-sm text-[var(--color-muted)]">
            <ShareCard
              title="Distribution"
              value={
                surface === 'provider'
                  ? 'client exec team, engagement lead, provider ops'
                  : 'finance@client.com, ceo@client.com'
              }
            />
            <ShareCard
              title="Workspace link"
              value={
                surface === 'provider'
                  ? 'share.nucleus-pipeline.ai/workspaces/provider-deliverables'
                  : 'share.nucleus-pipeline.ai/workspaces/executive'
              }
            />
            <ShareCard title="Last delivery" value={latestDeliveredAt} />
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="gs-card rounded-2xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  );
}

function ShareCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {title}
      </div>
      <div className="mt-2 break-all text-[var(--color-ink)]">{value}</div>
    </div>
  );
}
