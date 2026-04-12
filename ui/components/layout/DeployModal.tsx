'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, X } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard-store';

export function DeployModal() {
  const isOpen = useDashboardStore((state) => state.isDeployModalOpen);
  const isDeploying = useDashboardStore((state) => state.isDeploying);
  const stagedChanges = useDashboardStore((state) => state.stagedChanges);
  const close = useDashboardStore((state) => state.closeDeployModal);
  const setDeploying = useDashboardStore((state) => state.setDeploying);
  const deployStagedChanges = useDashboardStore(
    (state) => state.deployStagedChanges,
  );
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    setCompletedAt(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    deployStagedChanges();
    setDeploying(false);
    setCompletedAt(new Date().toISOString());
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="gs-card w-full max-w-2xl rounded-2xl p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Deploy
                </div>
                <h2 className="mt-2 font-serif text-2xl text-[var(--color-ink)]">
                  Promote staged runtime changes
                </h2>
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  Deploy applies staged topology changes into the runtime preview and records the action in the activity feed.
                </p>
              </div>
              <button
                className="rounded-full border border-black/10 p-2 text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-black/8 bg-black/[0.015] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                Staged changes
              </div>
              <div className="mt-3 space-y-3">
                {stagedChanges.length > 0 ? (
                  stagedChanges.map((change) => (
                    <div
                      key={change.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
                    >
                      <div>
                        <div className="font-medium text-[var(--color-ink)]">
                          {change.label}
                        </div>
                        <div className="mt-1 text-[var(--color-muted)]">
                          {change.kind} staged at{' '}
                          {new Date(change.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="rounded-full border border-[var(--color-brass)]/30 bg-[var(--color-brass)]/10 px-3 py-1 text-xs text-[var(--color-ink)]">
                        Pending
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-sm text-[var(--color-muted)]">
                    No staged changes yet. Use Create to prepare a node or service for deployment.
                  </div>
                )}
              </div>
            </div>

            {completedAt ? (
              <div className="mt-4 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/8 px-4 py-3 text-sm text-[var(--color-ink)]">
                Deployment completed at {new Date(completedAt).toLocaleString()}.
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-md border border-black/10 px-4 py-2 text-sm text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={close}
              >
                Close
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[var(--color-dark)] px-4 py-2 text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeploying || stagedChanges.length === 0}
                onClick={handleDeploy}
              >
                <Rocket className="h-4 w-4 text-[var(--color-brass)]" />
                {isDeploying ? 'Deploying...' : 'Deploy staged changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
