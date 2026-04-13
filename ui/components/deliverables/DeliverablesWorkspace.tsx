'use client';

import { useMemo } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useDashboardStore } from '@/store/dashboard-store';

type DeliverablesSurface = 'provider' | 'creator' | 'executive';

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
  if (lower.includes('hook')) {
    return 'Hook variants lifted neural score above threshold; the pipeline recommends promoting the top two hooks into production and retiring under-performing opens from the variant library.';
  }
  if (lower.includes('pacing') || lower.includes('tighten')) {
    return 'Pacing tightener recovered sustained attention on the middle beat; the pipeline surfaced two shorter cuts that beat the prior best score by more than 10 points.';
  }
  if (lower.includes('voice') || lower.includes('vo')) {
    return 'Voice swap shifted emotional resonance without degrading clarity; the new VO is recommended as the default read for this archetype and ICP.';
  }
  if (lower.includes('score') || lower.includes('neural') || lower.includes('tribe')) {
    return 'TRIBE v2 scoring identified a passing variant; the top drivers are hook attention and emotional resonance, with a recommended follow-up test on CTA placement.';
  }

  return 'The generation pipeline produced this variation, scored it with TRIBE v2, and shipped a creator-ready variant bundle for the next performance review.';
}

function getCopy(surface: DeliverablesSurface) {
  if (surface === 'provider') {
    return {
      eyebrow: 'Scoring',
      title: 'Video Performance & Variants',
      description:
        'Review the variants your generation pipeline is producing across each brief, including winning hooks, neural-score trends, and creator-ready share links.',
      summaryThreeLabel: 'Creator Messages',
    };
  }

  if (surface === 'executive') {
    return {
      eyebrow: 'Executive Workspace',
      title: 'Variant History and Sharing',
      description:
        'A narrow executive surface for reviewing shipped variants, understanding time-to-score, and sharing performance links with other stakeholders.',
      summaryThreeLabel: 'Recent Creator Messages',
    };
  }

  return {
    eyebrow: 'Scoring',
    title: 'Variants and Neural Scores',
    description:
      'Review the variants, neural scores, and recommendations the generation pipeline has produced for this brief, along with delivery timing and share links.',
    summaryThreeLabel: 'Brief Messages',
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
          shareUrl: `https://share.nucleus-pipeline.ai/variants/${task.id}`,
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
    : 'No variants yet';

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
          label="Variants Delivered"
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
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Variant History
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
                  <div className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1 text-xs text-[var(--color-ink)]">
                    Cycle time {deliverable.cycleTime}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {deliverable.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                    Open variant
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
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Sharing
          </div>
          <div className="space-y-3 text-sm text-[var(--color-muted)]">
            <ShareCard
              title="Distribution"
              value={
                surface === 'provider'
                  ? 'content team, creative lead, ops'
                  : 'growth@brand.com, ceo@brand.com'
              }
            />
            <ShareCard
              title="Workspace link"
              value={
                surface === 'provider'
                  ? 'share.nucleus-pipeline.ai/workspaces/variant-library'
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
