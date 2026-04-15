'use client';

import { getDefaultSystemPrompt } from '@/lib/system-prompt-defaults';
import { ModalFooter } from './ModalFooter';
import { NodeModalShell } from './NodeModalShell';
import { SystemPromptEditor } from './SystemPromptEditor';
import { TagInput } from './TagInput';
import { Field, RadioRow, Slider, Textarea } from './atoms';
import { useNodeDraft } from './useNodeDraft';

const ASPECTS = ['16:9', '9:16', '1:1'] as const;

interface StoryboardDraft extends Record<string, unknown> {
  prompt: string;
  frameCount: number;
  aspect: (typeof ASPECTS)[number];
  styleHints: string[];
  systemPrompt?: string;
}

const DEFAULT: StoryboardDraft = {
  prompt: '',
  frameCount: 4,
  aspect: '16:9',
  styleHints: [],
};

export interface StoryboardModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<StoryboardDraft>;
}

export function StoryboardModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: StoryboardModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<StoryboardDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const handleSave = () => {
    save();
    onClose();
  };

  const defaultPrompt = getDefaultSystemPrompt('storyboard', draft);

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Storyboard"
      subtitle="Sketch the shot list before generating video"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="storyboard"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Prompt">
          <Textarea
            placeholder="Opening hook on a rainy commute, pull into a cosy espresso moment…"
            value={draft.prompt}
            onChange={(e) => patch({ prompt: e.target.value })}
          />
        </Field>

        <Field label="Frames" hint={`${draft.frameCount}`}>
          <Slider
            min={1}
            max={8}
            value={draft.frameCount}
            onChange={(v) => patch({ frameCount: v })}
          />
        </Field>

        <Field label="Aspect ratio">
          <RadioRow
            name="storyboard-aspect"
            value={draft.aspect}
            options={ASPECTS.map((a) => ({ value: a, label: a }))}
            onChange={(value) => patch({ aspect: value })}
          />
        </Field>

        <Field label="Style hints (optional)">
          <TagInput
            value={draft.styleHints}
            onChange={(v) => patch({ styleHints: v })}
            placeholder="film-grain, anamorphic, golden hour…"
          />
        </Field>

        <SystemPromptEditor
          defaultPrompt={defaultPrompt}
          value={draft.systemPrompt}
          onChange={(v) => patch({ systemPrompt: v })}
        />
      </div>
    </NodeModalShell>
  );
}
