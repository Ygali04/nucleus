'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  XCircle,
  Zap,
} from 'lucide-react';
import { TimeAgo } from '@/components/shared/TimeAgo';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  complete: CheckCircle2,
  info: Circle,
};

export function ActivityPanel() {
  const activity = useDashboardStore((state) => state.activity);
  const highlightedNodeId = useCanvasStore((state) => state.highlightedNodeId);
  const highlightNode = useCanvasStore((state) => state.highlightNode);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const isCollapsed = useCanvasStore((state) => state.isActivityPanelCollapsed);
  const toggleActivityPanel = useCanvasStore(
    (state) => state.toggleActivityPanel,
  );

  return (
    <motion.div
      layout
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`gs-card fixed bottom-5 right-5 z-30 flex overflow-hidden ${isCollapsed ? 'w-auto' : 'w-[300px] max-h-[440px] flex-col'}`}
    >
      <button
        className={`flex items-center justify-between gap-3 px-4 py-3 text-left ${isCollapsed ? 'min-w-[180px]' : 'w-full border-b border-black/8'}`}
        onClick={toggleActivityPanel}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <Zap className="h-4 w-4 text-[var(--color-brass)]" />
          Activity
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)]">
            {activity.length} events
          </span>
          {isCollapsed ? (
            <ChevronUp className="h-4 w-4 text-[var(--color-muted)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
          )}
        </div>
      </button>

      {!isCollapsed ? (
        <div className="gs-scroll overflow-y-auto">
          {activity.slice(0, 50).map((entry, index) => {
            const kind =
              entry.type === 'error' || entry.type === 'task_failed'
                ? 'error'
                : entry.type === 'task_completed'
                  ? 'complete'
                  : entry.type === 'reflection' || entry.type === 'preempted'
                    ? 'warning'
                    : 'info';
            const Icon = iconMap[kind];
            const selected = highlightedNodeId === entry.agent;

            return (
              <motion.button
                key={`${entry.ts}-${index}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full items-start gap-3 border-b border-black/6 px-4 py-3 text-left transition ${
                  selected
                    ? 'bg-[var(--color-brass)]/10'
                    : 'hover:bg-black/[0.02]'
                }`}
                onClick={() => {
                  highlightNode(entry.agent);
                  selectNode(entry.agent);
                }}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 flex-none ${
                    kind === 'error'
                      ? 'text-[var(--color-error)]'
                      : kind === 'complete'
                        ? 'text-[var(--color-success)]'
                        : kind === 'warning'
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--color-brass)]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-[var(--color-ink)]">
                    {typeof entry.data.summary === 'string'
                      ? entry.data.summary
                      : entry.taskTitle || 'Agent activity update'}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[var(--color-muted)]">
                    <span className="truncate">{entry.agent}</span>
                    <TimeAgo value={entry.ts} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </motion.div>
  );
}
