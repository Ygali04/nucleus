'use client';

import { usePipelineStore } from '@/store/pipeline-store';

export function CostDisplay() {
  const totalCost = usePipelineStore((s) => s.totalCost);
  const candidates = usePipelineStore((s) => s.currentJob?.candidates ?? []);

  return (
    <div className="rounded-lg border border-[rgba(26,26,26,0.1)] bg-white p-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Total cost
      </div>
      <div className="mb-4 font-mono text-2xl font-semibold text-[var(--color-ink)]">
        ${totalCost.toFixed(2)}
      </div>

      {candidates.length > 0 ? (
        <div className="space-y-2 border-t border-[rgba(26,26,26,0.05)] pt-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Per candidate
          </div>
          {candidates.map((c) => {
            const cost = c.iterations.reduce((sum, it) => sum + it.costUsd, 0);
            return (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-[var(--color-muted)]">
                  {c.icp} · {c.language} · {c.platform}
                </span>
                <span className="ml-2 font-mono text-[var(--color-ink)]">
                  ${cost.toFixed(3)}
                  <span className="ml-1 text-[10px] text-[var(--color-muted)]">
                    ({c.iterations.length} iter)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
