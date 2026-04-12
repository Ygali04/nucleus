'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { DashboardSurface } from '@/lib/surface';
import { useDashboardStore } from '@/store/dashboard-store';

interface WorkspaceDetailsModalProps {
  surface: DashboardSurface;
}

function getSurfaceCopy(surface: DashboardSurface) {
  if (surface === 'provider') {
    return {
      eyebrow: 'Provider Details',
      title: 'Nucleus Pipeline Control Surface',
      description:
        'This view exposes cross-runtime diagnostics, staged topology changes, and provider-only operational controls.',
      visibility: 'Provider-only diagnostics and governance',
    };
  }

  return {
    eyebrow: 'Project Details',
    title: 'Client Developer Workspace',
    description:
      'This view exposes task flow, deliverables, and project-safe activity without provider diagnostics or spend telemetry.',
    visibility: 'Client-safe project operations',
  };
}

export function WorkspaceDetailsModal({
  surface,
}: WorkspaceDetailsModalProps) {
  const isOpen = useDashboardStore((state) => state.isDetailsOpen);
  const close = useDashboardStore((state) => state.closeDetails);
  const agents = useDashboardStore((state) => state.agents);
  const tasks = useDashboardStore((state) => state.tasks);
  const messages = useDashboardStore((state) => state.messages);
  const stagedChanges = useDashboardStore((state) => state.stagedChanges);
  const lastSyncedAt = useDashboardStore((state) => state.lastSyncedAt);
  const isLiveMode = useDashboardStore((state) => state.isLiveMode);
  const copy = getSurfaceCopy(surface);

  const activeAgents = agents.filter((agent) => agent.state.status === 'running').length;
  const openTasks = tasks.filter(
    (task) => task.status === 'pending' || task.status === 'active',
  ).length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;

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
            className="gs-card w-full max-w-3xl rounded-2xl p-6"
          >
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {copy.eyebrow}
                </div>
                <h2 className="mt-2 font-serif text-2xl text-[var(--color-ink)]">
                  {copy.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-[var(--color-muted)]">
                  {copy.description}
                </p>
              </div>
              <button
                className="rounded-full border border-black/10 p-2 text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <DetailCard label="Mode" value={isLiveMode ? 'Live runtime' : 'Demo'} />
              <DetailCard label="Active agents" value={String(activeAgents)} />
              <DetailCard label="Open tasks" value={String(openTasks)} />
              <DetailCard label="Completed reports" value={String(completedTasks)} />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr,1fr]">
              <section className="rounded-2xl border border-black/8 bg-black/[0.015] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                  Workspace Snapshot
                </div>
                <div className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
                  <Row label="Visibility" value={copy.visibility} />
                  <Row
                    label="Last synced"
                    value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Not yet synced'}
                  />
                  <Row label="Messages in flow" value={String(messages.length)} />
                  {surface === 'provider' ? (
                    <Row
                      label="Staged changes"
                      value={String(stagedChanges.length)}
                    />
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-black/8 bg-black/[0.015] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
                  Available Actions
                </div>
                <div className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
                  <p>
                    {surface === 'provider'
                      ? 'Details, Sync, Create, and Deploy are available here for Nucleus Pipeline operators.'
                      : 'Client developers can inspect workspace details and trigger a fresh sync of project-safe data.'}
                  </p>
                  {surface === 'provider' ? (
                    <p>
                      Create stages new topology changes locally, while Deploy promotes staged changes into the runtime preview.
                    </p>
                  ) : (
                    <p>
                      Provider-only diagnostics, deployment controls, and topology mutation are intentionally hidden from this client surface.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-black/[0.015] px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span>{label}</span>
      <span className="text-right text-[var(--color-ink)]">{value}</span>
    </div>
  );
}
