'use client';

import { X } from 'lucide-react';

const EDIT_PRIMITIVES: Array<{ id: string; label: string; description: string }> = [
  { id: 'hook_rewrite', label: 'Hook Rewrite', description: 'Regenerate the first 2 seconds with a stronger pattern interrupt' },
  { id: 'cut_tightening', label: 'Cut Tightening', description: 'Remove the lowest-engagement second of footage' },
  { id: 'music_swap', label: 'Music Swap', description: 'Replace the music bed with a higher-arousal track' },
  { id: 'pacing_change', label: 'Pacing Change', description: 'Insert a breath beat or slow a transition' },
  { id: 'narration_rewrite', label: 'Narration Rewrite', description: 'Rewrite a specific narration line with Brand KB grounding' },
  { id: 'visual_substitution', label: 'Visual Substitution', description: 'Regenerate a B-roll clip with a tighter style prompt' },
  { id: 'caption_emphasis', label: 'Caption Emphasis', description: 'Add emphasis captions for the line that needs to land' },
  { id: 'icp_reanchor', label: 'ICP Re-anchor', description: 'Swap the opening pain-point phrasing for a more ICP-specific one' },
];

export interface FullscreenEditorProps {
  open: boolean;
  beforeVideoUrl: string | null;
  afterVideoUrl: string | null;
  beforeScore: number;
  afterScore: number | null;
  onClose: () => void;
  onEditRetry: (editType: string) => void;
}

export function FullscreenEditor({
  open,
  beforeVideoUrl,
  afterVideoUrl,
  beforeScore,
  afterScore,
  onClose,
  onEditRetry,
}: FullscreenEditorProps) {
  if (!open) return null;

  const delta =
    afterScore !== null && afterScore !== undefined ? afterScore - beforeScore : null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.08)] px-6 py-4">
          <div className="text-lg font-semibold text-[var(--color-ink)]">
            Variant editor
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-[var(--color-muted)] hover:bg-[var(--color-muted-bg,#f5f6f8)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-6 overflow-auto px-6 py-6">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Before · Score {beforeScore.toFixed(1)}
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              {beforeVideoUrl ? (
                <video src={beforeVideoUrl} controls className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/60">
                  No preview
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <span>After</span>
              {afterScore !== null && afterScore !== undefined ? (
                <span>· Score {afterScore.toFixed(1)}</span>
              ) : null}
              {delta !== null ? (
                <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({delta >= 0 ? '+' : ''}
                  {delta.toFixed(1)})
                </span>
              ) : null}
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              {afterVideoUrl ? (
                <video src={afterVideoUrl} controls className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/60">
                  Pick an edit below
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(26,26,26,0.08)] px-6 py-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Apply a targeted edit
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {EDIT_PRIMITIVES.map((p) => (
              <button
                key={p.id}
                onClick={() => onEditRetry(p.id)}
                className="rounded-lg border border-[rgba(26,26,26,0.1)] bg-white p-3 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft,#eef2ff)]"
              >
                <div className="text-sm font-semibold text-[var(--color-ink)]">
                  {p.label}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
