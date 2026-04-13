'use client';

import { Book } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCampaignsStore } from '@/store/campaigns-store';
import {
  deleteAttachment,
  getAttachment,
  saveAttachment,
  type AttachmentMeta,
} from '@/lib/attachment-store';
import { AttachmentDropzone } from './AttachmentDropzone';
import { Field } from './Field';
import { NodeModalShell } from './NodeModalShell';
import { TagInput } from './TagInput';

interface BrandKBModalProps {
  campaignId: string;
  nodeId: string;
  open: boolean;
  onClose: () => void;
}

interface BrandKBData {
  brandName?: string;
  voiceTone?: string[];
  toneAdjectives?: string[];
  personality?: string[];
  energyLevel?: string[];
  brandSound?: string;
  styleGuidelines?: string;
  attachments?: AttachmentMeta[];
}

const INTEGRATIONS = ['Connect Notion', 'Connect Google Drive', 'Connect Slack'];

export function BrandKBModal({
  campaignId,
  nodeId,
  open,
  onClose,
}: BrandKBModalProps) {
  const existing = useCampaignsStore(
    (state) => state.nodeData[campaignId]?.[nodeId] as BrandKBData | undefined,
  );
  const updateNodeData = useCampaignsStore((state) => state.updateNodeData);

  const [brandName, setBrandName] = useState('');
  const [toneAdjectives, setToneAdjectives] = useState<string[]>([]);
  const [personality, setPersonality] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<string[]>([]);
  const [brandSound, setBrandSound] = useState('');
  const [styleGuidelines, setStyleGuidelines] = useState('');
  const [attachmentMeta, setAttachmentMeta] = useState<AttachmentMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    setBrandName(existing?.brandName ?? '');
    setToneAdjectives(existing?.toneAdjectives ?? []);
    setPersonality(existing?.personality ?? []);
    setEnergyLevel(existing?.energyLevel ?? []);
    setBrandSound(existing?.brandSound ?? '');
    setStyleGuidelines(existing?.styleGuidelines ?? '');
    const prior = existing?.attachments ?? [];
    setAttachmentMeta(prior);

    let cancelled = false;
    Promise.all(prior.map((meta) => getAttachment(meta.id))).then((results) => {
      if (cancelled) return;
      setFiles(results.filter((file): file is File => file !== null));
    });

    return () => {
      cancelled = true;
    };
  }, [open, existing]);

  const handleFilesChange = (next: File[]) => {
    setFiles(next);
  };

  const handleSave = async () => {
    if (!brandName.trim()) return;

    const retainedMeta: AttachmentMeta[] = [];
    const retainedFileRefs = new Set<File>();
    const deletions: Promise<void>[] = [];

    for (const meta of attachmentMeta) {
      const match = files.find(
        (file) =>
          file.name === meta.name &&
          file.size === meta.size &&
          !retainedFileRefs.has(file),
      );
      if (match) {
        retainedMeta.push(meta);
        retainedFileRefs.add(match);
      } else {
        deletions.push(deleteAttachment(meta.id));
      }
    }

    const newFiles = files.filter((file) => !retainedFileRefs.has(file));
    const [newMeta] = await Promise.all([
      Promise.all(newFiles.map(saveAttachment)),
      Promise.all(deletions),
    ]);

    const allMeta = [...retainedMeta, ...newMeta];
    const voiceTone = [...toneAdjectives, ...personality, ...energyLevel];

    updateNodeData(campaignId, nodeId, {
      brandName: brandName.trim(),
      voiceTone,
      toneAdjectives,
      personality,
      energyLevel,
      brandSound,
      styleGuidelines,
      attachments: allMeta,
      docCount: allMeta.length,
      status: 'active',
      statusText: 'Complete',
    });

    onClose();
  };

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Brand Knowledge Base"
      nodeIcon={<Book className="h-4 w-4" />}
      onSave={handleSave}
      saveDisabled={!brandName.trim()}
    >
      <div className="space-y-6">
        <Field label="Brand name" required>
          <input
            className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)]"
            placeholder="Acme"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
          />
        </Field>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">
            Voice &amp; tone
          </h3>
          <div className="space-y-3">
            <Field label="Tone adjective">
              <TagInput
                value={toneAdjectives}
                onChange={setToneAdjectives}
                placeholder="Playful, confident, warm…"
              />
            </Field>
            <Field label="Personality">
              <TagInput
                value={personality}
                onChange={setPersonality}
                placeholder="Mentor, rebel, expert…"
              />
            </Field>
            <Field label="Energy level">
              <TagInput
                value={energyLevel}
                onChange={setEnergyLevel}
                placeholder="High-energy, calm, punchy…"
              />
            </Field>
            <Field label="How should the brand sound?">
              <textarea
                rows={3}
                className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
                placeholder="Direct, witty, never salesy."
                value={brandSound}
                onChange={(event) => setBrandSound(event.target.value)}
              />
            </Field>
          </div>
        </section>

        <Field label="Knowledge attachments">
          <AttachmentDropzone
            accept={['.md', '.txt', '.pdf']}
            files={files}
            onChange={handleFilesChange}
          />
        </Field>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">
            External integrations
          </h3>
          <div className="flex flex-wrap gap-2">
            {INTEGRATIONS.map((label) => (
              <button
                key={label}
                type="button"
                disabled
                title="Coming soon"
                className="cursor-not-allowed rounded-md border border-black/10 bg-black/[0.02] px-3 py-1.5 text-sm text-[var(--color-muted)] opacity-60"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <Field label="Style guidelines">
          <textarea
            rows={6}
            className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            placeholder="Long-form notes on visual identity, typography, preferred phrases, banned phrases…"
            value={styleGuidelines}
            onChange={(event) => setStyleGuidelines(event.target.value)}
          />
        </Field>
      </div>
    </NodeModalShell>
  );
}

