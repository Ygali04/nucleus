'use client';

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { scoreColor } from '@/lib/score-color';
import { NEURAL_DIMENSIONS } from '@/lib/types';
import type { MetricScore, NeuralScoreBreakdown } from '@/lib/types';

interface DimensionBreakdownProps {
  score: NeuralScoreBreakdown;
  metrics: MetricScore[];
  threshold?: number;
}

interface DimensionRow {
  label: string;
  score: number;
  brain_region: string;
  gtm_proxy: string;
}

interface DimensionTooltipPayload {
  payload?: DimensionRow;
}

function DimensionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: DimensionTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-[var(--color-ink)]">{row.label}</div>
      <div className="mt-1 text-[var(--color-muted)]">
        Score: {row.score.toFixed(1)}
      </div>
      <div className="text-[var(--color-muted)]">
        Region: {row.brain_region}
      </div>
      <div className="text-[var(--color-muted)]">GTM: {row.gtm_proxy}</div>
    </div>
  );
}

export function DimensionBreakdown({
  score,
  metrics,
  threshold = 72,
}: DimensionBreakdownProps) {
  const metricMap = new Map(metrics.map((metric) => [metric.name, metric]));
  const data: DimensionRow[] = NEURAL_DIMENSIONS.map(({ key, label }) => {
    const metric = metricMap.get(key);
    return {
      label,
      score: score[key],
      brain_region: metric?.brain_region ?? '—',
      gtm_proxy: metric?.gtm_proxy ?? '—',
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#777' }}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={150}
          tick={{ fontSize: 11, fill: '#555' }}
        />
        <Tooltip cursor={{ fill: 'rgba(26,26,26,0.04)' }} content={<DimensionTooltip />} />
        <Bar dataKey="score" radius={[0, 6, 6, 0]}>
          {data.map((row) => (
            <Cell key={row.label} fill={scoreColor(row.score, threshold)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
