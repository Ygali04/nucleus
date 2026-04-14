import { type NodeProps } from '@xyflow/react';
import { Brain } from 'lucide-react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { scoreColor } from '@/lib/score-color';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';

export function ScoringNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    neuralScore?: number | null;
    threshold?: number;
    topMetrics?: Array<{ name: string; score: number }>;
    iterationCount?: number;
    scoreDelta?: number | null;
    bypassed?: boolean;
  };
  const score = d.neuralScore ?? 0;
  const threshold = d.threshold ?? 72;
  const color = scoreColor(score, threshold);
  const ruflo = isRufloAdded(node.data);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <NodeContextMenuWrapper nodeId={id} kind="scoring">
      <div
        className={`gs-card relative min-w-[232px] max-w-[232px] rounded-xl border bg-white px-3 py-3 ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="scoring" />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Neural Score</span>
          </div>
          {d.iterationCount ? (
            <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 text-[10px] text-[var(--color-primary)]">
              iter {d.iterationCount}
            </span>
          ) : null}
        </div>

        <div className="mb-2 flex items-center gap-3">
          <svg width="72" height="72" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#e6e8ec" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
              {score.toFixed(1)}
            </text>
          </svg>

          <div className="min-w-0 flex-1 space-y-1">
            {(d.topMetrics ?? []).slice(0, 3).map((m) => (
              <div key={m.name} className="flex items-center justify-between text-[10px]">
                <span className="truncate text-[var(--color-muted)]">{m.name}</span>
                <span className="ml-1 font-mono" style={{ color: scoreColor(m.score, threshold) }}>
                  {m.score.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {d.scoreDelta !== null && d.scoreDelta !== undefined ? (
          <div className="text-[11px]">
            <span className={d.scoreDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {d.scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(d.scoreDelta).toFixed(1)}
            </span>
            <span className="ml-1 text-[var(--color-muted)]">vs previous</span>
          </div>
        ) : null}
      </div>
    </NodeContextMenuWrapper>
  );
}
