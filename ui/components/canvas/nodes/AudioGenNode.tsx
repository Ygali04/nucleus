import { type NodeProps } from '@xyflow/react';
import { AudioLines, Music } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';

export function AudioGenNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    kind?: 'voice' | 'music';
    voiceName?: string;
    language?: string;
    mood?: string;
    costUsd?: number;
    durationS?: number;
    bypassed?: boolean;
  };
  const tone = STATUS_MAP[node.status];
  const Icon = d.kind === 'music' ? Music : AudioLines;
  const ruflo = isRufloAdded(node.data);

  const bars = Array.from({ length: 14 }, (_, i) =>
    8 + Math.floor(14 * Math.abs(Math.sin((i + 1) * 1.3))),
  );

  return (
    <NodeContextMenuWrapper nodeId={id} kind="audio_gen">
      <div
        className={`gs-card relative min-w-[208px] max-w-[208px] rounded-xl border bg-white px-3 py-3 ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="audio_gen" extraInputs={(d as { extraInputs?: any }).extraInputs} extraOutputs={(d as { extraOutputs?: any }).extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-[var(--color-primary)]" />
            <span>{d.kind === 'music' ? 'Music' : 'Voice'}</span>
          </div>
          {d.costUsd !== undefined ? (
            <span className="font-mono text-[10px]">${d.costUsd.toFixed(3)}</span>
          ) : null}
        </div>

        <div className="mb-2 flex h-8 items-end gap-0.5 rounded bg-[var(--color-muted-bg,#f5f6f8)] px-2 py-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-sm bg-[var(--color-primary)]"
              style={{ height: `${h}px`, opacity: 0.7 }}
            />
          ))}
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
    </NodeContextMenuWrapper>
  );
}
