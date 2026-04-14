'use client';

import { useCanvasStore } from '@/store/canvas-store';

interface InlineVideoPreviewProps {
  src: string;
  durationS?: number;
  className?: string;
}

export function InlineVideoPreview({
  src,
  durationS,
  className = '',
}: InlineVideoPreviewProps) {
  const openMediaPreview = useCanvasStore((s) => s.openMediaPreview);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openMediaPreview(src, 'video');
      }}
      className={`group relative block aspect-video w-full overflow-hidden rounded-md bg-black shadow-inner ${className}`}
      aria-label="Open video preview"
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
      {durationS ? (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 font-mono text-[9px] text-white">
          {durationS.toFixed(1)}s
        </span>
      ) : null}
    </button>
  );
}
