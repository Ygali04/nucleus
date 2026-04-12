import { BrassPill } from '@/components/shared/BrassPill';
import { StatusDot } from '@/components/shared/StatusDot';
import { STATUS_MAP } from '@/lib/constants';
import type { AgentDetailModel } from '@/lib/types';

interface AgentDetailProps {
  detail: AgentDetailModel;
  showProviderMetrics?: boolean;
  showProviderConfig?: boolean;
}

export function AgentDetail({
  detail,
  showProviderMetrics = true,
  showProviderConfig = true,
}: AgentDetailProps) {
  const tone = STATUS_MAP[detail.statusTone];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {detail.typeLabel}
        </div>
        <h2 className="font-serif text-2xl text-[var(--color-ink)]">
          {detail.title}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <StatusDot
            color={tone.color}
            pulse={detail.statusTone === 'active'}
          />
          <span>{detail.status}</span>
          <span className="text-black/20">·</span>
          <span>{detail.lastActivity}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Tasks today"
          value={String(detail.metrics.tasksToday)}
        />
        <MetricCard label="Avg duration" value={detail.metrics.avgDuration} />
        {showProviderMetrics ? (
          <>
            <MetricCard
              label="Cost today"
              value={`$${detail.metrics.costToday.toFixed(2)}`}
            />
            <MetricCard
              label="Tokens"
              value={detail.metrics.tokens.toLocaleString()}
            />
          </>
        ) : (
          <>
            <MetricCard
              label="Facts tracked"
              value={detail.metrics.factCount.toLocaleString()}
            />
            <MetricCard
              label="Memory entries"
              value={detail.metrics.vectorEntries.toLocaleString()}
            />
          </>
        )}
      </div>

      <section>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
          Recent Tasks
        </div>
        <div className="space-y-2">
          {detail.recentTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-black/8 bg-black/[0.015] px-3 py-2"
            >
              <div className="text-sm font-medium text-[var(--color-ink)]">
                {task.title}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-muted)]">
                <BrassPill tone="neutral">{task.status}</BrassPill>
                <span>{task.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
          Memory
        </div>
        <div className="rounded-lg border border-black/8 bg-black/[0.015] px-4 py-3 text-sm text-[var(--color-muted)]">
          <div>{detail.metrics.factCount} facts tracked</div>
          <div>
            {detail.metrics.vectorEntries.toLocaleString()} vector entries
          </div>
          <div className="mt-2 text-[var(--color-ink)]">
            Last learned: {detail.metrics.lastLearned}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
          Configuration
        </div>
        <div className="space-y-2 text-sm text-[var(--color-muted)]">
          <ConfigRow label="Permission" value={detail.config.permission} />
          {showProviderConfig ? (
            <>
              <ConfigRow label="Model" value={detail.config.model} />
              <ConfigRow
                label="Max iterations"
                value={String(detail.config.maxIterations)}
              />
            </>
          ) : null}
          <ConfigRow
            label="Tags"
            value={detail.config.tags.join(', ') || 'none'}
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/8 bg-black/[0.015] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-black/8 bg-black/[0.015] px-4 py-3">
      <span>{label}</span>
      <span className="text-right text-[var(--color-ink)]">{value}</span>
    </div>
  );
}
