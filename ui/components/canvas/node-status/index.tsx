import type { ReactNode } from 'react';
import type { NodeExecutionState } from '@/lib/types';
import { ExecutingRing } from './ExecutingRing';
import { ExecutionTimingBadge } from './ExecutionTimingBadge';
import { NodeProgressBar } from './NodeProgressBar';

export { ExecutingRing, ExecutionTimingBadge, NodeProgressBar };

export function readExecutionState(
  data: Record<string, unknown> | undefined,
): NodeExecutionState {
  const d = (data ?? {}) as NodeExecutionState;
  return {
    executionStatus: d.executionStatus,
    progressPercent: d.progressPercent,
    progressLabel: d.progressLabel,
    lastExecutionS: d.lastExecutionS,
    lastCostUsd: d.lastCostUsd,
    cached: d.cached,
  };
}

export function isExecuting(state: NodeExecutionState): boolean {
  return state.executionStatus === 'executing' || state.executionStatus === 'running';
}

interface CachedPillProps {
  show: boolean;
}

export function CachedPill({ show }: CachedPillProps) {
  if (!show) return null;
  return (
    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
      ⚡ cached
    </span>
  );
}

interface NodeExecutionOverlayProps {
  state: NodeExecutionState;
  children: ReactNode;
}

/** Wraps a node card with the executing ring + cached opacity. */
export function NodeExecutionOverlay({ state, children }: NodeExecutionOverlayProps) {
  return (
    <ExecutingRing active={isExecuting(state)}>
      <div className={state.cached ? 'opacity-90' : undefined}>{children}</div>
    </ExecutingRing>
  );
}

interface NodeExecutionBadgesProps {
  state: NodeExecutionState;
  className?: string;
}

/** Top-right cached pill + timing badge. Renders nothing when idle. */
export function NodeExecutionBadges({
  state,
  className = 'absolute right-2 top-2 flex items-center gap-1',
}: NodeExecutionBadgesProps) {
  const showTiming = !!state.lastExecutionS && state.lastExecutionS > 0;
  if (!state.cached && !showTiming) return null;
  return (
    <div className={className}>
      <CachedPill show={!!state.cached && !showTiming} />
      {showTiming ? (
        <ExecutionTimingBadge
          durationS={state.lastExecutionS ?? 0}
          costUsd={state.lastCostUsd}
          cached={state.cached}
        />
      ) : null}
    </div>
  );
}

interface NodeExecutionFooterProps {
  state: NodeExecutionState;
}

/** Bottom progress bar; hidden when progress is 0/null. */
export function NodeExecutionFooter({ state }: NodeExecutionFooterProps) {
  return (
    <NodeProgressBar
      percent={state.progressPercent ?? 0}
      label={state.progressLabel}
    />
  );
}
