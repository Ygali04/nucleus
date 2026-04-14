'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';

export function MediaLightboxModal() {
  const openMedia = useCanvasStore((s) => s.openMedia);
  const closeMediaPreview = useCanvasStore((s) => s.closeMediaPreview);

  useEffect(() => {
    if (!openMedia) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMediaPreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openMedia, closeMediaPreview]);

  if (!openMedia) return null;

  const { src, kind } = openMedia;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={closeMediaPreview}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={closeMediaPreview}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="max-h-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {kind === 'video' ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
          />
        ) : kind === 'audio' ? (
          <div className="w-[480px] max-w-full rounded-lg bg-[var(--color-surface,#fff)] p-6 shadow-2xl">
            <audio src={src} controls autoPlay className="w-full" />
          </div>
        ) : (
          <img
            src={src}
            alt=""
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
