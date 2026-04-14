'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';

interface InlineAudioPreviewProps {
  src: string;
  durationS?: number;
  className?: string;
}

const BAR_COUNT = 14;

function buildBars(durationS?: number): number[] {
  const seed = durationS ?? 7;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const h = 6 + Math.floor(14 * Math.abs(Math.sin((i + 1) * 1.3 + seed * 0.1)));
    return h;
  });
}

export function InlineAudioPreview({
  src,
  durationS,
  className = '',
}: InlineAudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const openMediaPreview = useCanvasStore((s) => s.openMediaPreview);
  const bars = buildBars(durationS);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const expand = (e: React.MouseEvent) => {
    e.stopPropagation();
    openMediaPreview(src, 'audio');
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-md bg-[var(--color-muted-bg,#f5f6f8)] px-2 py-1.5 shadow-inner ${className}`}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:opacity-90"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 translate-x-[1px]" />}
      </button>
      <button
        type="button"
        onClick={expand}
        className="flex flex-1 items-end gap-0.5"
        aria-label="Open audio preview"
      >
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm bg-[var(--color-primary)]"
            style={{ height: `${h}px`, opacity: playing ? 0.95 : 0.6 }}
          />
        ))}
      </button>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
