import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AudioLines, Music } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { InlineAudioPreview } from '@/components/canvas/node-previews/InlineAudioPreview';

const STATIC_BARS = Array.from({ length: 14 }, (_, i) =>
  8 + Math.floor(14 * Math.abs(Math.sin((i + 1) * 1.3))),
);

export function AudioGenNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    kind?: 'voice' | 'music';
    voiceName?: string;
    language?: string;
    mood?: string;
    audioUrl?: string | null;
    costUsd?: number;
    durationS?: number;
  };
  const tone = STATUS_MAP[node.status];
  const Icon = d.kind === 'music' ? Music : AudioLines;

  return (
    <div
      className="gs-card relative min-w-[208px] max-w-[208px] overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="flex h-6 items-center justify-between bg-[var(--color-dark,#1a1a1a)]/95 px-3 text-[10px] uppercase tracking-[0.12em] text-white">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          <span>{d.kind === 'music' ? 'Music' : 'Voice'}</span>
        </div>
        {d.costUsd !== undefined ? (
          <span className="font-mono text-[10px] opacity-80">${d.costUsd.toFixed(3)}</span>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <div className="mb-2">
          {d.audioUrl ? (
            <InlineAudioPreview src={d.audioUrl} durationS={d.durationS} />
          ) : (
            <div className="flex h-8 items-end gap-0.5 rounded-md bg-[var(--color-muted-bg,#f5f6f8)] px-2 py-1 shadow-inner">
              {STATIC_BARS.map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-sm bg-[var(--color-primary)]"
                  style={{ height: `${h}px`, opacity: 0.7 }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">{node.label}</div>

        {(d.voiceName || d.language || d.mood) ? (
          <div className="mb-2 truncate text-[11px] text-[var(--color-muted)]">
            {d.voiceName ?? d.mood ?? '—'}
            {d.language ? ` · ${d.language}` : ''}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <StatusDot color={tone.color} pulse={node.status === 'active'} />
            <span>{node.statusText}</span>
          </div>
          {d.durationS ? <span className="font-mono text-[10px]">{d.durationS.toFixed(1)}s</span> : null}
        </div>
      </div>
    </div>
  );
}
