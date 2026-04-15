'use client';

import { getDefaultSystemPrompt } from '@/lib/system-prompt-defaults';
import { ModalFooter } from './ModalFooter';
import { NodeModalShell } from './NodeModalShell';
import { SystemPromptEditor } from './SystemPromptEditor';
import { Field, RadioRow, Slider, TextInput, Textarea } from './atoms';
import { useNodeDraft } from './useNodeDraft';

const OPERATIONS = [
  { value: 'upscale', label: 'Upscale' },
  { value: 'theme_transition', label: 'Theme transition' },
  { value: 'style_transfer', label: 'Style transfer' },
  { value: 'text_to_image', label: 'Text-to-image' },
] as const;

type Operation = (typeof OPERATIONS)[number]['value'];

interface ImageEditDraft extends Record<string, unknown> {
  operation: Operation;
  prompt: string;
  referenceImageUrl: string;
  strength: number;
  systemPrompt?: string;
}

const DEFAULT: ImageEditDraft = {
  operation: 'upscale',
  prompt: '',
  referenceImageUrl: '',
  strength: 0.7,
};

export interface ImageEditModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<ImageEditDraft>;
}

export function ImageEditModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: ImageEditModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<ImageEditDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const handleSave = () => {
    save();
    onClose();
  };

  const defaultPrompt = getDefaultSystemPrompt('image_edit', draft);
  const needsReference = draft.operation !== 'text_to_image';

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Image edit"
      subtitle="Upscale, restyle, or synthesise a still"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="image_edit"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Operation">
          <RadioRow
            name="image-operation"
            value={draft.operation}
            options={OPERATIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(value) => patch({ operation: value })}
          />
        </Field>

        <Field label="Prompt">
          <Textarea
            placeholder="Describe the target style or desired content…"
            value={draft.prompt}
            onChange={(e) => patch({ prompt: e.target.value })}
          />
        </Field>

        {needsReference ? (
          <Field label="Reference image URL">
            <TextInput
              value={draft.referenceImageUrl}
              placeholder="https://…/reference.png"
              onChange={(e) => patch({ referenceImageUrl: e.target.value })}
            />
          </Field>
        ) : null}

        <Field label="Strength" hint={draft.strength.toFixed(2)}>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={draft.strength}
            onChange={(v) => patch({ strength: v })}
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
