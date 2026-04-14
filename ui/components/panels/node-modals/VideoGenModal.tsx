'use client';

import { Upload } from 'lucide-react';
import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, RadioRow, Slider, Textarea } from './atoms';
import { ProviderCardGrid, type ProviderCard } from './ProviderCardGrid';
import { useNodeDraft } from './useNodeDraft';

const PROVIDERS = [
  { id: 'kling', label: 'Kling 2.1 Master', costPerS: 0.084 },
  { id: 'seedance', label: 'Seedance 1 Pro', costPerS: 0.07 },
  { id: 'veo', label: 'Veo 3', costPerS: 0.3 },
  { id: 'runway', label: 'Runway Gen-4', costPerS: 0.25 },
  { id: 'luma', label: 'Luma Dream Machine', costPerS: 0.1 },
  { id: 'hailuo', label: 'MiniMax Hailuo', costPerS: 0.04 },
] as const satisfies readonly ProviderCard[];

type ProviderId = (typeof PROVIDERS)[number]['id'];

const ASPECTS = ['16:9', '9:16', '1:1'] as const;

interface VideoGenDraft extends Record<string, unknown> {
  prompt: string;
  provider: ProviderId;
  durationS: number;
  aspect: (typeof ASPECTS)[number];
  referenceImageUrl: string | null;
}

export interface VideoGenModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<VideoGenDraft>;
}

const DEFAULT: VideoGenDraft = {
  prompt: '',
  provider: 'kling',
  durationS: 6,
  aspect: '16:9',
  referenceImageUrl: null,
};

export function VideoGenModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: VideoGenModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<VideoGenDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const handleSave = () => {
    save();
    onClose();
  };

  const selectedProvider = PROVIDERS.find((p) => p.id === draft.provider);
  const estTotalCost =
    selectedProvider && selectedProvider.costPerS !== undefined
      ? draft.durationS * selectedProvider.costPerS
      : null;

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Video generation"
      subtitle="Describe the shot and pick a provider"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="video_gen"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="AI prompt">
          <Textarea
            placeholder="A warm-toned barista pulling espresso, cinematic closeup…"
            value={draft.prompt}
            onChange={(e) => patch({ prompt: e.target.value })}
          />
        </Field>

        <Field
          label="Provider"
          hint={
            estTotalCost !== null
              ? `Est. $${estTotalCost.toFixed(2)} for ${draft.durationS}s`
              : undefined
          }
        >
          <ProviderCardGrid
            providers={PROVIDERS}
            value={draft.provider}
            onChange={(id) => patch({ provider: id as ProviderId })}
          />
        </Field>

        <Field label="Duration" hint={`${draft.durationS.toFixed(0)}s`}>
          <Slider
            min={2}
            max={15}
            value={draft.durationS}
            onChange={(v) => patch({ durationS: v })}
          />
        </Field>

        <Field label="Aspect ratio">
          <RadioRow
            name="aspect"
            value={draft.aspect}
            options={ASPECTS.map((a) => ({ value: a, label: a }))}
            onChange={(value) => patch({ aspect: value })}
          />
        </Field>

        <Field label="Reference image (optional)">
          <ReferenceDropzone
            url={draft.referenceImageUrl}
            onChange={(url) => patch({ referenceImageUrl: url })}
          />
        </Field>
      </div>
    </NodeModalShell>
  );
}

function ReferenceDropzone({
  url,
  onChange,
}: {
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-black/15 bg-white px-3 py-3 text-xs text-[var(--color-muted)]">
      <Upload className="h-4 w-4" />
      {url ? (
        <div className="flex flex-1 items-center justify-between gap-2">
          <span className="truncate font-mono text-[11px]">{url}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded border border-black/10 px-2 py-0.5 text-[11px] text-[var(--color-ink)] hover:bg-black/[0.03]"
          >
            Remove
          </button>
        </div>
      ) : (
        <span>Drop an image or paste a URL to guide the model</span>
      )}
    </div>
  );
}
