'use client';

import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, RadioRow, Slider, TextInput, Textarea } from './atoms';
import { useNodeDraft } from './useNodeDraft';

const MODES = ['voice', 'music'] as const;
const LANGUAGES = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'];
const MOODS = ['uplifting', 'calm', 'intense', 'playful', 'nostalgic'];

interface AudioGenDraft extends Record<string, unknown> {
  mode: (typeof MODES)[number];
  // voice
  script: string;
  voiceName: string;
  language: string;
  paceWpm: number;
  // music
  mood: string;
  genre: string;
  durationS: number;
  energy: number;
}

const DEFAULT: AudioGenDraft = {
  mode: 'voice',
  script: '',
  voiceName: 'Aria',
  language: 'en-US',
  paceWpm: 160,
  mood: 'uplifting',
  genre: 'cinematic',
  durationS: 15,
  energy: 60,
};

export interface AudioGenModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<AudioGenDraft>;
}

export function AudioGenModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: AudioGenModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<AudioGenDraft>(
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
      title="Audio generation"
      subtitle="Voiceover or music bed"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="audio_gen"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Mode">
          <RadioRow
            name="mode"
            value={draft.mode}
            options={MODES.map((m) => ({
              value: m,
              label: m === 'voice' ? 'Voice' : 'Music',
            }))}
            onChange={(value) => patch({ mode: value })}
          />
        </Field>

        {draft.mode === 'voice' ? (
          <>
            <Field label="Script">
              <Textarea
                placeholder="Hi, I've been looking for a commute-friendly espresso setup…"
                value={draft.script}
                onChange={(e) => patch({ script: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Voice">
                <TextInput
                  value={draft.voiceName}
                  onChange={(e) => patch({ voiceName: e.target.value })}
                  placeholder="Aria, Rex, …"
                />
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="mt-2 w-full cursor-not-allowed rounded-md border border-dashed border-black/15 bg-white px-2 py-1.5 text-[11px] text-[var(--color-muted)] opacity-70"
                >
                  Clone from sample…
                </button>
              </Field>

              <Field label="Language">
                <select
                  value={draft.language}
                  onChange={(e) => patch({ language: e.target.value })}
                  className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Pace" hint={`${draft.paceWpm} wpm`}>
              <Slider
                min={90}
                max={220}
                value={draft.paceWpm}
                onChange={(v) => patch({ paceWpm: v })}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Mood">
              <RadioRow
                name="mood"
                value={draft.mood}
                options={MOODS.map((m) => ({ value: m, label: m }))}
                onChange={(value) => patch({ mood: value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Genre">
                <TextInput
                  value={draft.genre}
                  onChange={(e) => patch({ genre: e.target.value })}
                />
              </Field>
              <Field label="Duration" hint={`${draft.durationS}s`}>
                <Slider
                  min={5}
                  max={60}
                  value={draft.durationS}
                  onChange={(v) => patch({ durationS: v })}
                />
              </Field>
            </div>

            <Field label="Energy" hint={`${draft.energy}`}>
              <Slider
                min={0}
                max={100}
                value={draft.energy}
                onChange={(v) => patch({ energy: v })}
              />
            </Field>
          </>
        )}
      </div>
    </NodeModalShell>
  );
}
