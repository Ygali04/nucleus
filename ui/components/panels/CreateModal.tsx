'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';
import type { GraphNodeKind } from '@/lib/types';

const tabs = [
  'Video Gen',
  'Audio Gen',
  'Composition',
  'Scoring',
  'Editor',
  'Brand KB',
  'ICP',
  'Delivery',
] as const;

const TAB_META: Record<
  (typeof tabs)[number],
  {
    kind: GraphNodeKind;
    defaultStatus: string;
    modelPlaceholder: string;
    metaLabel: string;
    metaPlaceholder: string;
  }
> = {
  'Video Gen': {
    kind: 'video_gen',
    defaultStatus: 'idle',
    modelPlaceholder: 'kling-3.0',
    metaLabel: 'Provider',
    metaPlaceholder: 'kling / runway / pika',
  },
  'Audio Gen': {
    kind: 'audio_gen',
    defaultStatus: 'idle',
    modelPlaceholder: 'elevenlabs-v2',
    metaLabel: 'Provider',
    metaPlaceholder: 'elevenlabs / suno',
  },
  Composition: {
    kind: 'composition',
    defaultStatus: 'idle',
    modelPlaceholder: 'remotion',
    metaLabel: 'Template',
    metaPlaceholder: 'hero-15s / reel-30s',
  },
  Scoring: {
    kind: 'scoring',
    defaultStatus: 'idle',
    modelPlaceholder: 'neural-score-v2',
    metaLabel: 'Model',
    metaPlaceholder: 'neural-score-v2',
  },
  Editor: {
    kind: 'editor',
    defaultStatus: 'idle',
    modelPlaceholder: 'edit-agent',
    metaLabel: 'Edit type',
    metaPlaceholder: 'hook-rewrite / cta',
  },
  'Brand KB': {
    kind: 'brand_kb',
    defaultStatus: 'idle',
    modelPlaceholder: 'brand-kb',
    metaLabel: 'Source',
    metaPlaceholder: 'brand-docs / site',
  },
  ICP: {
    kind: 'icp',
    defaultStatus: 'idle',
    modelPlaceholder: 'persona-builder',
    metaLabel: 'Platform',
    metaPlaceholder: 'tiktok / instagram / youtube',
  },
  Delivery: {
    kind: 'delivery',
    defaultStatus: 'idle',
    modelPlaceholder: 'cdn-delivery',
    metaLabel: 'Formats',
    metaPlaceholder: 'mp4 / mov / webm',
  },
};

export function CreateModal() {
  const isCreateModalOpen = useCanvasStore((state) => state.isCreateModalOpen);
  const closeCreateModal = useCanvasStore((state) => state.closeCreateModal);
  const createEntity = useDashboardStore((state) => state.createEntity);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Video Gen');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(TAB_META['Video Gen'].defaultStatus);
  const [metaTag, setMetaTag] = useState('');
  const [subtype, setSubtype] = useState('default');
  const [notes, setNotes] = useState('');

  const meta = TAB_META[activeTab];

  const resetForm = () => {
    setName('');
    setStatus(meta.defaultStatus);
    setMetaTag('');
    setSubtype('default');
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
    setSubtype('default');
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createEntity({
      kind: meta.kind,
      label: name.trim(),
      subtype: subtype.trim() || 'default',
      status:
        status === 'active' ? 'active' : status === 'error' ? 'error' : 'idle',
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

            <div className="mb-5 flex flex-wrap gap-2 border-b border-black/8 pb-4">
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
                placeholder="default"
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
