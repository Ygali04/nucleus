'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';

interface NodeDetailDrawerProps {
  showProviderMetrics?: boolean;
  showProviderControls?: boolean;
}

export function NodeDetailDrawer({
  showProviderControls = true,
}: NodeDetailDrawerProps = {}) {
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const customNodes = useDashboardStore((state) => state.customNodes);

  const selectedNode = customNodes.find((node) => node.id === selectedNodeId);

  return (
    <AnimatePresence>
      {selectedNode ? (
        <motion.aside
          key={selectedNode.id}
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="gs-scroll fixed bottom-0 right-0 top-[92px] z-40 w-[380px] overflow-y-auto border-l border-black/8 bg-white/96 px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <button
              className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              onClick={() => selectNode(null)}
            >
              ← Back to canvas
            </button>
            <button
              className="rounded-full border border-black/8 p-2 text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
              onClick={() => selectNode(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {selectedNode.kind.replace(/_/g, ' ')}
          </div>
          <h3 className="mb-2 font-serif text-xl text-[var(--color-ink)]">
            {selectedNode.label}
          </h3>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            {selectedNode.statusText}
          </p>
          {selectedNode.metaTag ? (
            <div className="mb-4 inline-flex rounded-full border border-black/10 bg-black/[0.02] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
              {selectedNode.metaTag}
            </div>
          ) : null}

          {showProviderControls ? (
            <div className="mt-8 flex gap-2">
              <button className="rounded-md border border-black/10 px-3 py-2 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                View Logs
              </button>
              <button className="rounded-md border border-black/10 px-3 py-2 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                Edit Config
              </button>
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
