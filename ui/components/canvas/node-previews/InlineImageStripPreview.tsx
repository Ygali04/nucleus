'use client';

import { useCanvasStore } from '@/store/canvas-store';

interface InlineImageStripPreviewProps {
  images: Array<{ src: string; fullSrc?: string; kind?: 'video' | 'image' }>;
  max?: number;
  className?: string;
}

export function InlineImageStripPreview({
  images,
  max = 5,
  className = '',
}: InlineImageStripPreviewProps) {
  const openMediaPreview = useCanvasStore((s) => s.openMediaPreview);
  const shown = images.slice(0, max);

  if (shown.length === 0) return null;

  return (
    <div className={`grid grid-cols-5 gap-1 ${className}`}>
      {shown.map((img, i) => (
        <button
          key={`${img.src}-${i}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openMediaPreview(img.fullSrc ?? img.src, img.kind ?? 'image');
          }}
          className="group relative aspect-square overflow-hidden rounded bg-[var(--color-muted-bg,#f5f6f8)] shadow-inner"
          aria-label={`Open preview ${i + 1}`}
        >
          <img
            src={img.src}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </button>
      ))}
    </div>
  );
}
