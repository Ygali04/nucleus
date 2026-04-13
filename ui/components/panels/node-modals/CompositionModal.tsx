'use client';

import { useCampaignsStore } from '@/store/campaigns-store';
import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, RadioRow } from './atoms';
import { useNodeDraft } from './useNodeDraft';

const ARCHETYPES = ['Demo', 'Marketing', 'Knowledge', 'Education'] as const;

interface CompositionDraft extends Record<string, unknown> {
  archetype: (typeof ARCHETYPES)[number];
}

const DEFAULT: CompositionDraft = { archetype: 'Marketing' };

export interface CompositionModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<CompositionDraft>;
}

export function CompositionModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: CompositionModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<CompositionDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const nodes = useCampaignsStore((s) => s.campaigns[campaignId]?.nodes);
  const upstream = (nodes ?? [])
    .filter((n) => n.kind === 'video_gen' || n.kind === 'audio_gen')
    .map((n) => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      durationS: (n.data?.durationS as number | undefined) ?? 0,
    }));

  const totalDuration = upstream.reduce((sum, s) => sum + s.durationS, 0);

  const handleSave = () => {
    save();
    onClose();
  };

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Composition"
      subtitle="Assemble upstream scenes into a single timeline"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="composition"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Archetype">
          <RadioRow
            name="archetype"
            value={draft.archetype}
            options={ARCHETYPES.map((a) => ({ value: a, label: a }))}
            onChange={(value) => patch({ archetype: value })}
          />
        </Field>

        <Field
          label="Scenes (upstream)"
          hint={`${upstream.length} source${upstream.length === 1 ? '' : 's'}`}
        >
          {upstream.length === 0 ? (
            <div className="rounded-md border border-dashed border-black/15 bg-white px-3 py-3 text-xs text-[var(--color-muted)]">
              Connect VideoGen or AudioGen nodes upstream to populate scenes.
            </div>
          ) : (
            <ul className="divide-y divide-black/5 rounded-md border border-black/10 bg-white">
              {upstream.map((s, idx) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5 font-mono text-[10px] text-[var(--color-muted)]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[var(--color-ink)]">
                      {s.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                      {s.kind === 'video_gen' ? 'video' : 'audio'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--color-muted)]">
                    {s.durationS.toFixed(1)}s
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <Field label="Total duration" hint={`${totalDuration.toFixed(1)}s`}>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full bg-[var(--color-primary)]"
              style={{
                width: `${Math.min(100, totalDuration * 2)}%`,
              }}
            />
          </div>
        </Field>
      </div>
    </NodeModalShell>
  );
}
