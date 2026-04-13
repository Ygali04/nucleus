'use client';

import { NodeModalShell } from './NodeModalShell';
import { ModalFooter } from './ModalFooter';
import { Field, TextInput } from './atoms';
import { useNodeDraft } from './useNodeDraft';

const EXPORT_FORMATS = ['mp4', 'webm', 'gif', 'story-crop'] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

interface DeliveryDraft extends Record<string, unknown> {
  exportFormats: ExportFormat[];
  cdnUrl: string;
  email: string;
  webhookUrl: string;
}

const DEFAULT: DeliveryDraft = {
  exportFormats: ['mp4'],
  cdnUrl: '',
  email: '',
  webhookUrl: '',
};

export interface DeliveryModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<DeliveryDraft>;
}

export function DeliveryModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: DeliveryModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<DeliveryDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const toggleFormat = (fmt: ExportFormat) => {
    const set = new Set(draft.exportFormats);
    if (set.has(fmt)) set.delete(fmt);
    else set.add(fmt);
    patch({ exportFormats: Array.from(set) });
  };

  const handleSave = () => {
    save();
    onClose();
  };

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Delivery"
      subtitle="Export formats and destinations"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="delivery"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Export formats">
          <div className="flex flex-wrap gap-2">
            {EXPORT_FORMATS.map((fmt) => {
              const active = draft.exportFormats.includes(fmt);
              return (
                <label
                  key={fmt}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-black/10 bg-white text-[var(--color-ink)] hover:bg-black/[0.03]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleFormat(fmt)}
                    className="sr-only"
                  />
                  {fmt}
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="CDN URL">
          <TextInput
            value={draft.cdnUrl}
            placeholder="https://cdn.example.com/…"
            onChange={(e) => patch({ cdnUrl: e.target.value })}
          />
        </Field>

        <Field label="Email">
          <TextInput
            type="email"
            value={draft.email}
            placeholder="team@example.com"
            onChange={(e) => patch({ email: e.target.value })}
          />
        </Field>

        <Field label="Webhook">
          <TextInput
            value={draft.webhookUrl}
            placeholder="https://hooks.example.com/…"
            onChange={(e) => patch({ webhookUrl: e.target.value })}
          />
        </Field>
      </div>
    </NodeModalShell>
  );
}
