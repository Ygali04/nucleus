import type { CanvasNodeData } from '@/lib/graph-layout';
import { BRAND, STATUS_MAP } from '@/lib/constants';

type NodeStatus = CanvasNodeData['status'];

/**
 * Semantic alias map from the pipeline-facing vocabulary
 * (idle/running/done/failed/needs-config) to the underlying node status.
 * Keeps node card props uniform while leaving STATUS_MAP as the single
 * source of truth for colors.
 */
const SEMANTIC_ALIASES: Record<string, { color: string; label: string }> = {
  running: { color: STATUS_MAP.active.color, label: 'Running' },
  done: { color: STATUS_MAP.active.color, label: 'Done' },
  failed: { color: STATUS_MAP.error.color, label: 'Failed' },
  'needs-config': { color: BRAND.warning, label: 'Needs config' },
};

function resolveTone(status: NodeStatus | string) {
  if (status in STATUS_MAP) {
    const entry = STATUS_MAP[status as NodeStatus];
    return { color: entry.color, label: entry.label };
  }
  return SEMANTIC_ALIASES[status] ?? { color: BRAND.idle, label: 'Idle' };
}

interface NodeStatusChipProps {
  status: NodeStatus | string;
  text?: string;
}

export function NodeStatusChip({ status, text }: NodeStatusChipProps) {
  const tone = resolveTone(status);
  const label = text ?? tone.label;
  const isPulsing = status === 'active' || status === 'running';

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: `${tone.color}33`,
        backgroundColor: `${tone.color}14`,
        color: tone.color,
      }}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full ${isPulsing ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: tone.color }}
      />
      {label}
    </span>
  );
}
