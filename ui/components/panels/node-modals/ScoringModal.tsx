'use client';

import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, RadioRow, Slider } from './atoms';
import { useNodeDraft } from './useNodeDraft';

const CONTENT_TYPES = ['tiktok', 'instagram', 'youtube', 'custom'] as const;

interface ScoreReport {
  score: number;
  dimensions?: Array<{ name: string; score: number }>;
}

interface ScoringDraft extends Record<string, unknown> {
  threshold: number;
  contentType: (typeof CONTENT_TYPES)[number];
  report?: ScoreReport;
}

const DEFAULT: ScoringDraft = {
  threshold: 72,
  contentType: 'tiktok',
};

export interface ScoringModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<ScoringDraft>;
}

export function ScoringModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: ScoringModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<ScoringDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const report = draft.report;
  const topDimensions = (report?.dimensions ?? []).slice(0, 3);

  const handleSave = () => {
    save();
    onClose();
  };

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
        <Field label="Threshold" hint={draft.threshold.toFixed(1)}>
          <Slider
            min={0}
            max={100}
            step={0.1}
            value={draft.threshold}
            onChange={(v) => patch({ threshold: v })}
          />
        </Field>

        <Field label="Content type">
          <RadioRow
            name="contentType"
            value={draft.contentType}
            options={CONTENT_TYPES.map((c) => ({ value: c, label: c }))}
            onChange={(value) => patch({ contentType: value })}
          />
        </Field>

        {report ? (
          <Field label="Latest report">
            <div className="rounded-md border border-black/10 bg-white p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[var(--color-muted)]">Score</span>
                <span className="font-mono text-lg font-semibold text-[var(--color-ink)]">
                  {report.score.toFixed(1)}
                </span>
              </div>
              {topDimensions.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {topDimensions.map((d) => (
                    <li key={d.name}>
                      <div className="flex justify-between text-[11px] text-[var(--color-muted)]">
                        <span>{d.name}</span>
                        <span className="font-mono">
                          {d.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full bg-[var(--color-primary)]"
                          style={{
                            width: `${Math.min(100, Math.max(0, d.score))}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Field>
        ) : null}
      </div>
    </NodeModalShell>
  );
}
