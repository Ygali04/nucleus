'use client';

import { Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCampaignsStore } from '@/store/campaigns-store';
import { getDefaultSystemPrompt } from '@/lib/system-prompt-defaults';
import { Field } from './Field';
import { NodeModalShell } from './NodeModalShell';
import { SystemPromptEditor } from './SystemPromptEditor';
import { TagInput } from './TagInput';

interface ICPModalProps {
  campaignId: string;
  nodeId: string;
  open: boolean;
  onClose: () => void;
}

interface ICPData {
  personaName?: string;
  platform?: string;
  painPoint?: string;
  desiredOutcome?: string;
  culturalMarkers?: string[];
  systemPrompt?: string;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram Reels' },
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
] as const;

export function ICPModal({ campaignId, nodeId, open, onClose }: ICPModalProps) {
  const existing = useCampaignsStore((state) => {
    const graph = state.campaigns.find((c) => c.id === campaignId)?.graph as
      | { nodes?: Array<{ id: string; data?: Record<string, unknown> }> }
      | undefined;
    const node = graph?.nodes?.find((n) => n.id === nodeId);
    return node?.data as ICPData | undefined;
  });
  const updateNodeData = useCampaignsStore((state) => state.updateNodeData);

  const [personaName, setPersonaName] = useState('');
  const [platform, setPlatform] = useState<string>(PLATFORMS[0].id);
  const [painPoint, setPainPoint] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [culturalMarkers, setCulturalMarkers] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setPersonaName(existing?.personaName ?? '');
    setPlatform(existing?.platform ?? PLATFORMS[0].id);
    setPainPoint(existing?.painPoint ?? '');
    setDesiredOutcome(existing?.desiredOutcome ?? '');
    setCulturalMarkers(existing?.culturalMarkers ?? []);
    setSystemPrompt(existing?.systemPrompt);
  }, [open, existing]);

  const handleSave = () => {
    if (!personaName.trim()) return;
    updateNodeData(campaignId, nodeId, {
      personaName: personaName.trim(),
      platform,
      painPoint,
      desiredOutcome,
      culturalMarkers,
      systemPrompt,
      status: 'active',
      statusText: 'Complete',
    });
    onClose();
  };

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Ideal Customer Persona"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-[var(--color-muted)] hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!personaName.trim()}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <Field label="Persona name" required>
          <input
            className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
            placeholder="Busy founder, 25–34"
            value={personaName}
            onChange={(event) => setPersonaName(event.target.value)}
          />
        </Field>

        <Field label="Platform">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  platform === p.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft,#eef2ff)] text-[var(--color-primary)]'
                    : 'border-black/10 text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <input
                  type="radio"
                  name="icp-platform"
                  value={p.id}
                  checked={platform === p.id}
                  onChange={() => setPlatform(p.id)}
                  className="hidden"
                />
                {p.label}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Pain point">
          <textarea
            rows={3}
            className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            placeholder="What keeps them up at night?"
            value={painPoint}
            onChange={(event) => setPainPoint(event.target.value)}
          />
        </Field>

        <Field label="Desired outcome">
          <textarea
            rows={3}
            className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            placeholder="What does success look like for them?"
            value={desiredOutcome}
            onChange={(event) => setDesiredOutcome(event.target.value)}
          />
        </Field>

        <Field label="Cultural markers">
          <TagInput
            value={culturalMarkers}
            onChange={setCulturalMarkers}
            placeholder="Slang, references, subcultures…"
          />
        </Field>

        <SystemPromptEditor
          defaultPrompt={getDefaultSystemPrompt('icp', {
            personaName,
            platform,
            painPoint,
          })}
          value={systemPrompt}
          onChange={setSystemPrompt}
        />
      </div>
    </NodeModalShell>
  );
}

