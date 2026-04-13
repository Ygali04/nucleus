'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';

const tabs = ['Agent', 'Database', 'Scheduler', 'Connector'] as const;

const TAB_META = {
  Agent: {
    kind: 'agent' as const,
    defaultStatus: 'idle',
    modelPlaceholder: 'minimax/minimax-m2.5',
    metaLabel: 'Model',
    metaPlaceholder: 'minimax/minimax-m2.5',
  },
  Database: {
    kind: 'database' as const,
    defaultStatus: 'active',
    modelPlaceholder: 'postgres',
    metaLabel: 'Engine',
    metaPlaceholder: 'postgres / clickhouse / sqlite',
  },
  Scheduler: {
    kind: 'scheduler' as const,
    defaultStatus: 'active',
    modelPlaceholder: 'cron',
    metaLabel: 'Cadence',
    metaPlaceholder: 'Every hour / daily / weekly',
  },
  Connector: {
    kind: 'service' as const,
    defaultStatus: 'active',
    modelPlaceholder: 'erpnext-connector',
    metaLabel: 'Endpoint',
    metaPlaceholder: 'erpnext / email / webhook bridge',
  },
};

export function CreateModal() {
  const isCreateModalOpen = useCanvasStore((state) => state.isCreateModalOpen);
  const closeCreateModal = useCanvasStore((state) => state.closeCreateModal);
  const createEntity = useDashboardStore((state) => state.createEntity);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Agent');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(TAB_META.Agent.defaultStatus);
  const [metaTag, setMetaTag] = useState('');
  const [subtype, setSubtype] = useState('specialist');
  const [notes, setNotes] = useState('');

  const meta = TAB_META[activeTab];

  const resetForm = () => {
    setName('');
    setStatus(meta.defaultStatus);
    setMetaTag('');
    setSubtype(activeTab === 'Agent' ? 'specialist' : activeTab.toLowerCase());
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    closeCreateModal();
  };

  const handleTabChange = (tab: (typeof tabs)[number]) => {
    setActiveTab(tab);
    setStatus(TAB_META[tab].defaultStatus);
    setMetaTag('');
    setSubtype(tab === 'Agent' ? 'specialist' : tab.toLowerCase());
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createEntity({
      kind: meta.kind,
      label: name.trim(),
      subtype: subtype.trim() || activeTab.toLowerCase(),
      status: status === 'active' ? 'active' : status === 'error' ? 'error' : 'idle',
      metaTag: metaTag.trim() || meta.modelPlaceholder,
      notes:
        notes.trim() ||
        `${name.trim()} staged from the ${activeTab.toLowerCase()} creation flow with initial status ${status}.`,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen ? (
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
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Create
                </div>
                <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                  Instantiate New Node
                </h2>
              </div>
              <button
                className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={handleClose}
              >
                Close
              </button>
            </div>

            <div className="mb-5 flex gap-2 border-b border-black/8 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeTab === tab
                      ? 'bg-[var(--color-dark)] text-white'
                      : 'bg-black/[0.03] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Name"
                placeholder={`${activeTab.toLowerCase()}-name`}
                value={name}
                onChange={setName}
              />
              <Field
                label="Status"
                placeholder={meta.defaultStatus}
                value={status}
                onChange={setStatus}
              />
              <Field
                label={meta.metaLabel}
                placeholder={meta.metaPlaceholder}
                value={metaTag}
                onChange={setMetaTag}
              />
              <Field
                label="Subtype"
                placeholder={activeTab.toLowerCase()}
                value={subtype}
                onChange={setSubtype}
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-[var(--color-muted)]">
                Notes
              </span>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
                placeholder="Describe the new node, intended role, and dependencies."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-md border border-black/10 px-4 py-2 text-sm text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-[var(--color-dark)] px-4 py-2 text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!name.trim()}
                onClick={handleSubmit}
              >
                Stage for Deploy
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[var(--color-muted)]">
        {label}
      </span>
      <input
        className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
