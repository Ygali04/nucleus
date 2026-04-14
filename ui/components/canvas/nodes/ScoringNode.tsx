import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Brain } from 'lucide-react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { scoreColor } from '@/lib/score-color';

function buildSparkline(values: number[], width = 200, height = 24): string {
  if (values.length < 2) return '';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function ScoringNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    neuralScore?: number | null;
    threshold?: number;
    topMetrics?: Array<{ name: string; score: number }>;
    iterationCount?: number;
    scoreDelta?: number | null;
    attentionCurve?: number[];
  };
  const score = d.neuralScore ?? 0;
  const threshold = d.threshold ?? 72;
  const color = scoreColor(score, threshold);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const curve = d.attentionCurve ?? [];
  const sparklinePoints = curve.length >= 2 ? buildSparkline(curve) : null;

  return (
    <div
      className="gs-card relative min-w-[232px] max-w-[232px] overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="flex h-6 items-center justify-between bg-[var(--color-dark,#1a1a1a)]/95 px-3 text-[10px] uppercase tracking-[0.12em] text-white">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3 w-3" />
          <span>Neural Score</span>
        </div>
        {d.iterationCount ? (
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px]">
            iter {d.iterationCount}
          </span>
        ) : null}
      </div>

      <div className="px-3 py-3">
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

        {sparklinePoints ? (
          <svg
            width="100%"
            height="24"
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            className="mb-2 block w-full"
            aria-label="Attention curve"
          >
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparklinePoints}
            />
          </svg>
        ) : null}

        {d.scoreDelta !== null && d.scoreDelta !== undefined ? (
          <div className="text-[11px]">
            <span className={d.scoreDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {d.scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(d.scoreDelta).toFixed(1)}
            </span>
            <span className="ml-1 text-[var(--color-muted)]">vs previous</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
