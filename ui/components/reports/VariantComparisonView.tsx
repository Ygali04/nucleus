'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '@/components/shared/ChartCard';
import { NeuralScoreGauge } from '@/components/reports/NeuralScoreGauge';
import { SURFACE_SCORE_THRESHOLD } from '@/lib/surface';
import { NEURAL_DIMENSIONS } from '@/lib/types';
import type { NeuroPeerReport } from '@/lib/types';

interface VariantComparisonViewProps {
  entries: Array<{ variantId: string; label: string; report: NeuroPeerReport }>;
  threshold?: number;
}

const OVERLAY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#0ea5e9'];

function formatDelta(delta: number) {
  const sign = delta > 0 ? '+' : delta < 0 ? '' : '';
  return `${sign}${delta.toFixed(1)}`;
}

export function VariantComparisonView({
  entries,
  threshold = SURFACE_SCORE_THRESHOLD,
}: VariantComparisonViewProps) {
  if (entries.length < 2) return null;

  const baseline = entries[0];
  const curveLength = Math.max(
    ...entries.map((entry) => entry.report.attention_curve.length),
  );
  const overlayData = Array.from({ length: curveLength }, (_, index) => {
    const row: Record<string, number> = { second: index };
    entries.forEach((entry) => {
      const value = entry.report.attention_curve[index];
      if (typeof value === 'number') row[entry.variantId] = value;
    });
    return row;
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entries.map((entry) => (
          <div
            key={entry.variantId}
            className="gs-card flex flex-col items-center rounded-2xl p-5"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              {entry.label}
            </div>
            <div className="mt-3">
              <NeuralScoreGauge
                score={entry.report.neural_score.total}
                threshold={threshold}
                size={160}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="gs-card rounded-2xl p-5">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Dimension Delta — vs {baseline.label}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <th className="pb-2 font-medium">Dimension</th>
                {entries.map((entry) => (
                  <th key={entry.variantId} className="pb-2 font-medium">
                    {entry.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NEURAL_DIMENSIONS.map(({ key, label }) => {
                const baselineScore = baseline.report.neural_score[key];
                return (
                  <tr key={key} className="border-t border-black/8">
                    <td className="py-2 text-[var(--color-ink)]">{label}</td>
                    {entries.map((entry, index) => {
                      const value = entry.report.neural_score[key];
                      const delta = value - baselineScore;
                      return (
                        <td key={entry.variantId} className="py-2 font-mono">
                          <span className="text-[var(--color-ink)]">
                            {value.toFixed(1)}
                          </span>
                          {index > 0 ? (
                            <span
                              className={`ml-2 text-xs ${
                                delta > 0
                                  ? 'text-emerald-600'
                                  : delta < 0
                                    ? 'text-rose-600'
                                    : 'text-[var(--color-muted)]'
                              }`}
                            >
                              {formatDelta(delta)}
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ChartCard
        title="Attention Overlay"
        subtitle="Per-second attention curve across selected variants"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={overlayData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
            <XAxis
              dataKey="second"
              tick={{ fontSize: 11, fill: '#777' }}
              tickFormatter={(value: number) => `${value}s`}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#777' }}
              width={32}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number'
                  ? value.toFixed(1)
                  : String(value ?? '')
              }
              labelFormatter={(value) => `${value}s`}
            />
            <Legend verticalAlign="top" height={28} iconType="plainline" />
            {entries.map((entry, index) => (
              <Line
                key={entry.variantId}
                type="monotone"
                dataKey={entry.variantId}
                name={entry.label}
                stroke={OVERLAY_COLORS[index % OVERLAY_COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
