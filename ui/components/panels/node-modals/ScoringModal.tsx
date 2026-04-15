'use client';

import Link from 'next/link';
import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, RadioRow, Slider, TextInput } from './atoms';
import { useNodeDraft } from './useNodeDraft';
import { useCampaignsStore } from '@/store/campaigns-store';
import { NeuralScoreGauge } from '@/components/reports/NeuralScoreGauge';
import type { NeuroPeerReport } from '@/lib/types';

const CONTENT_TYPES = ['tiktok', 'instagram', 'youtube', 'custom'] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

const ON_PASS_OPTIONS = [
  { value: 'deliver', label: 'Send to delivery' },
  { value: 'iterate', label: 'Continue iterating' },
] as const;
type OnPass = (typeof ON_PASS_OPTIONS)[number]['value'];

interface ScoreReport {
  score: number;
  dimensions?: Array<{ name: string; score: number }>;
}

interface ScoringDraft extends Record<string, unknown> {
  threshold: number;
  contentType: ContentType;
  thresholdOverride?: number | null;
  maxIterationsOverride?: number | null;
  variantsRequiredOverride?: number | null;
  contentTypeOverride?: ContentType | null;
  onThresholdPassed?: OnPass;
  report?: ScoreReport;
  analysisResult?: NeuroPeerReport | null;
  variantId?: string | null;
}

const DEFAULT: ScoringDraft = {
  threshold: 72,
  contentType: 'tiktok',
  onThresholdPassed: 'deliver',
};

export interface ScoringModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<ScoringDraft>;
}

function asNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asContentType(v: unknown, fallback: ContentType): ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(v as string)
    ? (v as ContentType)
    : fallback;
}

export function ScoringModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: ScoringModalProps) {
  const campaign = useCampaignsStore((s) =>
    s.campaigns.find((c) => c.id === campaignId) ?? null,
  );
  const brief = (campaign?.brief ?? {}) as Record<string, unknown>;

  const campaignThreshold = asNumber(brief.threshold, 72);
  const campaignMaxIterations = asNumber(brief.maxIterations, 3);
  const campaignVariantsRequired = asNumber(brief.variantsRequired, 3);
  const campaignContentType = asContentType(brief.contentType, 'tiktok');

  const { draft, patch, save, retry, remove } = useNodeDraft<ScoringDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const thresholdEff =
    draft.thresholdOverride ?? draft.threshold ?? campaignThreshold;
  const contentTypeEff =
    draft.contentTypeOverride ?? draft.contentType ?? campaignContentType;
  const onPassEff: OnPass = draft.onThresholdPassed ?? 'deliver';

  const analysis = draft.analysisResult ?? null;
  const legacyReport = draft.report;

  // Build top-3 weakest metrics from analysisResult if present.
  const weakest = analysis?.metrics
    ? [...analysis.metrics].sort((a, b) => a.score - b.score).slice(0, 3)
    : [];

  const handleSave = () => {
    save();
    onClose();
  };

  const handleNumberInput = (
    raw: string,
    key: 'maxIterationsOverride' | 'variantsRequiredOverride',
  ) => {
    if (raw === '') {
      patch({ [key]: null } as Partial<ScoringDraft>);
      return;
    }
    const n = Number(raw);
    if (Number.isFinite(n)) {
      patch({ [key]: n } as Partial<ScoringDraft>);
    }
  };

  const variantId = draft.variantId ?? null;
  const reportHref = variantId
    ? `/reports?variant=${encodeURIComponent(variantId)}`
    : '/reports';

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Scoring"
      subtitle="NeuroPeer content evaluation"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="scoring"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Threshold"
          hint={`${thresholdEff.toFixed(1)}${
            draft.thresholdOverride != null ? ' (override)' : ''
          }`}
        >
          <Slider
            min={50}
            max={95}
            step={1}
            value={thresholdEff}
            onChange={(v) => patch({ thresholdOverride: v })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Max iterations"
            hint={
              draft.maxIterationsOverride == null
                ? `default ${campaignMaxIterations}`
                : 'override'
            }
          >
            <TextInput
              type="number"
              min={1}
              value={
                draft.maxIterationsOverride == null
                  ? ''
                  : String(draft.maxIterationsOverride)
              }
              placeholder={String(campaignMaxIterations)}
              onChange={(e) =>
                handleNumberInput(e.target.value, 'maxIterationsOverride')
              }
            />
          </Field>

          <Field
            label="Variants to pass"
            hint={
              draft.variantsRequiredOverride == null
                ? `default ${campaignVariantsRequired}`
                : 'override'
            }
          >
            <TextInput
              type="number"
              min={1}
              value={
                draft.variantsRequiredOverride == null
                  ? ''
                  : String(draft.variantsRequiredOverride)
              }
              placeholder={String(campaignVariantsRequired)}
              onChange={(e) =>
                handleNumberInput(e.target.value, 'variantsRequiredOverride')
              }
            />
          </Field>
        </div>

        <Field label="Content type">
          <RadioRow
            name="contentType"
            value={contentTypeEff}
            options={CONTENT_TYPES.map((c) => ({ value: c, label: c }))}
            onChange={(value) => patch({ contentTypeOverride: value })}
          />
        </Field>

        <Field label="On threshold passed">
          <RadioRow
            name="onThresholdPassed"
            value={onPassEff}
            options={ON_PASS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(value) => patch({ onThresholdPassed: value })}
          />
        </Field>

        {analysis ? (
          <Field label="Latest NeuroPeer report">
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="flex items-center gap-3">
                <NeuralScoreGauge
                  score={analysis.neural_score?.total ?? 0}
                  threshold={thresholdEff}
                  size={96}
                  label="Score"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                    Weakest metrics
                  </div>
                  <ul className="mt-1 space-y-1.5">
                    {weakest.length === 0 ? (
                      <li className="text-[11px] text-[var(--color-muted)]">
                        No metric data
                      </li>
                    ) : (
                      weakest.map((m) => (
                        <li key={m.name}>
                          <div className="flex justify-between text-[11px]">
                            <span className="truncate text-[var(--color-ink)]">
                              {m.name}
                            </span>
                            <span className="font-mono text-[var(--color-muted)]">
                              {m.score.toFixed(1)}
                            </span>
                          </div>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-black/5">
                            <div
                              className="h-full bg-[var(--color-primary)]"
                              style={{
                                width: `${Math.min(100, Math.max(0, m.score))}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
              <div className="mt-3 text-right">
                <Link
                  href={reportHref}
                  className="text-[11px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Open full report →
                </Link>
              </div>
            </div>
          </Field>
        ) : legacyReport ? (
          <Field label="Latest report">
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[var(--color-muted)]">Score</span>
                <span className="font-mono text-lg font-semibold text-[var(--color-ink)]">
                  {legacyReport.score.toFixed(1)}
                </span>
              </div>
            </div>
          </Field>
        ) : null}
      </div>
    </NodeModalShell>
  );
}
