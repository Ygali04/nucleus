'use client';

import { useEffect, useState } from 'react';
import { getDefaultSystemPrompt } from '@/lib/system-prompt-defaults';
import { AttachmentDropzone } from './AttachmentDropzone';
import { InlineVideoPreview } from '@/components/canvas/node-previews/InlineVideoPreview';
import { ModalFooter } from './ModalFooter';
import { NodeModalShell } from './NodeModalShell';
import { SystemPromptEditor } from './SystemPromptEditor';
import { Field } from './atoms';
import { useNodeDraft } from './useNodeDraft';

interface SourceVideoDraft extends Record<string, unknown> {
  sourceUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  pendingUpload: boolean;
  systemPrompt?: string;
}

const DEFAULT: SourceVideoDraft = {
  sourceUrl: null,
  fileName: null,
  fileSize: null,
  pendingUpload: false,
};

export interface SourceVideoModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  nodeId: string;
  initial: Partial<SourceVideoDraft>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export function SourceVideoModal({
  open,
  onClose,
  campaignId,
  nodeId,
  initial,
}: SourceVideoModalProps) {
  const { draft, patch, save, retry, remove } = useNodeDraft<SourceVideoDraft>(
    campaignId,
    nodeId,
    { ...DEFAULT, ...initial },
  );

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const first = files[0];
    if (!first) {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(first);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  const handleSave = async () => {
    const first = files[0];
    if (first) {
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', first);
        const res = await fetch(
          `${API_BASE}/api/v1/tools/upload_source_video`,
          { method: 'POST', body: form },
        );
        if (res.ok) {
          const body = (await res.json()) as { url?: string };
          patch({
            sourceUrl: body.url ?? null,
            fileName: first.name,
            fileSize: first.size,
            pendingUpload: !body.url,
          });
        } else {
          patch({
            fileName: first.name,
            fileSize: first.size,
            pendingUpload: true,
          });
        }
      } catch {
        patch({
          fileName: first.name,
          fileSize: first.size,
          pendingUpload: true,
        });
      } finally {
        setUploading(false);
      }
    }
    save();
    onClose();
  };

  const defaultPrompt = getDefaultSystemPrompt('source_video', draft);
  const previewUrl = localPreviewUrl ?? draft.sourceUrl;

  return (
    <NodeModalShell
      open={open}
      onClose={onClose}
      title="Source video"
      subtitle="Upload a reference clip for downstream edits"
      footer={
        <ModalFooter
          campaignId={campaignId}
          nodeId={nodeId}
          kind="source_video"
          onSave={handleSave}
          onRetry={retry}
          onDelete={remove}
          saveDisabled={uploading}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Video file">
          <AttachmentDropzone
            accept={['.mp4', '.mov', '.webm']}
            files={files}
            onChange={setFiles}
          />
        </Field>

        {previewUrl ? (
          <Field label="Preview">
            <InlineVideoPreview src={previewUrl} />
          </Field>
        ) : draft.fileName ? (
          <Field label="Saved file">
            <div className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs text-[var(--color-muted)]">
              {draft.fileName}
              {draft.pendingUpload ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  pending upload
                </span>
              ) : null}
            </div>
          </Field>
        ) : null}

        <SystemPromptEditor
          defaultPrompt={defaultPrompt}
          value={draft.systemPrompt}
          onChange={(v) => patch({ systemPrompt: v })}
        />
      </div>
    </NodeModalShell>
  );
}
