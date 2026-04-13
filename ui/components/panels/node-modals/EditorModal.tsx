'use client';

import {
  Anchor,
  Captions,
  Image as ImageIcon,
  Mic,
  Music,
  PenLine,
  Scissors,
  Timer,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, RadioRow, TextInput, Textarea } from './atoms';
import { useNodeDraft } from './useNodeDraft';

type Primitive =
  | 'hook_rewrite'
  | 'cut_tightening'
  | 'music_swap'
  | 'pacing_change'
  | 'narration_rewrite'
  | 'visual_substitution'
  | 'caption_emphasis'
  | 'icp_reanchor';

const PRIMITIVES: Array<{
  value: Primitive;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    value: 'hook_rewrite',
    label: 'Hook rewrite',
    description: 'Rewrite the opening 3s to raise attention retention',
    icon: <PenLine className="h-3.5 w-3.5" />,
  },
  {
    value: 'cut_tightening',
    label: 'Cut tightening',
    description: 'Trim dead air and shorten low-energy pauses',
    icon: <Scissors className="h-3.5 w-3.5" />,
  },
  {
    value: 'music_swap',
    label: 'Music swap',
    description: 'Replace the underscore with a better-fitting track',
    icon: <Music className="h-3.5 w-3.5" />,
  },
  {
    value: 'pacing_change',
    label: 'Pacing change',
    description: 'Speed up or slow down to match target energy',
    icon: <Timer className="h-3.5 w-3.5" />,
  },
  {
    value: 'narration_rewrite',
    label: 'Narration rewrite',
    description: 'Rewrite VO for a specific segment',
    icon: <Mic className="h-3.5 w-3.5" />,
  },
  {
    value: 'visual_substitution',
    label: 'Visual substitution',
    description: 'Swap a shot for a stronger supporting visual',
    icon: <ImageIcon className="h-3.5 w-3.5" />,
  },
  {
    value: 'caption_emphasis',
    label: 'Caption emphasis',
    description: 'Highlight key phrases with on-screen text',
    icon: <Captions className="h-3.5 w-3.5" />,
  },
  {
    value: 'icp_reanchor',
    label: 'ICP re-anchor',
    description: 'Re-aim the narrative at the target persona',
    icon: <Anchor className="h-3.5 w-3.5" />,
  },
];

interface EditorDraft extends Record<string, unknown> {
  primitive: Primitive;
  targetStartS: number;
  targetEndS: number;
  autoTarget: boolean;
  edit_prompt: string;
}

const DEFAULT: EditorDraft = {
  primitive: 'hook_rewrite',
  targetStartS: 0,
  targetEndS: 3,
  autoTarget: true,
  edit_prompt: '',
};

export interface EditorModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<EditorDraft>;
}

export function EditorModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: EditorModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<EditorDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const handleSave = () => {
    save();
    onClose();
  };

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Editor"
      subtitle="Apply a targeted edit primitive"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="editor"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Edit primitive">
          <RadioRow
            name="primitive"
            value={draft.primitive}
            options={PRIMITIVES}
            onChange={(value) => patch({ primitive: value })}
          />
          <p className="mt-2 text-[11px] text-[var(--color-muted)]">
            {PRIMITIVES.find((p) => p.value === draft.primitive)?.description}
          </p>
        </Field>

        <Field label="Target window">
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              min={0}
              step={0.1}
              value={draft.targetStartS}
              disabled={draft.autoTarget}
              onChange={(e) =>
                patch({ targetStartS: Number(e.target.value) })
              }
              className="w-24"
            />
            <span className="text-xs text-[var(--color-muted)]">to</span>
            <TextInput
              type="number"
              min={0}
              step={0.1}
              value={draft.targetEndS}
              disabled={draft.autoTarget}
              onChange={(e) => patch({ targetEndS: Number(e.target.value) })}
              className="w-24"
            />
            <span className="ml-1 text-xs text-[var(--color-muted)]">sec</span>
          </div>
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={draft.autoTarget}
              onChange={(e) => patch({ autoTarget: e.target.checked })}
              className="accent-[var(--color-primary)]"
            />
            Auto (use weakest-scoring segment)
          </label>
        </Field>

        <Field label="Edit prompt">
          <Textarea
            placeholder="Rewrite the hook to lead with the commute pain point…"
            value={draft.edit_prompt}
            onChange={(e) => patch({ edit_prompt: e.target.value })}
          />
        </Field>
      </div>
    </NodeModalShell>
  );
}
