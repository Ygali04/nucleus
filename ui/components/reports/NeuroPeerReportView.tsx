'use client';

import { ChartCard } from '@/components/shared/ChartCard';
import { CurveStackChart } from '@/components/reports/CurveStackChart';
import { DimensionBreakdown } from '@/components/reports/DimensionBreakdown';
import { KeyMomentsList } from '@/components/reports/KeyMomentsList';
import { ModalityBreakdownChart } from '@/components/reports/ModalityBreakdownChart';
import { NeuralScoreGauge } from '@/components/reports/NeuralScoreGauge';
import { SURFACE_SCORE_THRESHOLD } from '@/lib/surface';
import type { NeuroPeerReport } from '@/lib/types';

interface NeuroPeerReportViewProps {
  report: NeuroPeerReport;
  threshold?: number;
}

export function NeuroPeerReportView({
  report,
  threshold = SURFACE_SCORE_THRESHOLD,
}: NeuroPeerReportViewProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-5">
        <div className="gs-card flex flex-col items-center rounded-2xl p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            {report.ai_report_title}
          </div>
          <div className="mt-4">
            <NeuralScoreGauge
              score={report.neural_score.total}
              threshold={threshold}
            />
          </div>
        </div>

        <div className="gs-card rounded-2xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            AI Summary
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink)]">
            {report.ai_summary}
          </p>
        </div>

        <div className="gs-card rounded-2xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Action Items
          </div>
          {report.ai_action_items.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              No action items suggested.
            </p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm text-[var(--color-ink)]">
              {report.ai_action_items.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 rounded-xl border border-black/8 bg-black/[0.015] px-3 py-2"
                >
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <ChartCard
          title="Dimension Breakdown"
          subtitle="Score by neural dimension, color-coded against threshold"
        >
          <DimensionBreakdown
            score={report.neural_score}
            metrics={report.metrics}
            threshold={threshold}
          />
        </ChartCard>

        <ChartCard
          title="Attention, Arousal, Load"
          subtitle="Per-second curves across the asset"
        >
          <CurveStackChart
            attention={report.attention_curve}
            emotionalArousal={report.emotional_arousal_curve}
            cognitiveLoad={report.cognitive_load_curve}
          />
        </ChartCard>

        <ChartCard
          title="Modality Contribution"
          subtitle="Visual, audio, and text share of neural signal per second"
        >
          <ModalityBreakdownChart data={report.modality_breakdown} />
        </ChartCard>

        <div className="gs-card rounded-2xl p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Key Moments
          </div>
          <KeyMomentsList moments={report.key_moments} />
        </div>
      </div>
    </div>
  );
}
