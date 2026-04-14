'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArchetypeCard } from '@/components/campaigns/ArchetypeCard';
import { ARCHETYPE_CONFIGS } from '@/lib/campaign-archetypes';
import type { CampaignArchetype } from '@/lib/campaign-archetypes';
import { useCampaignsStore } from '@/store/campaigns-store';

const ARCHETYPE_ORDER: CampaignArchetype[] = [
  'demo',
  'marketing',
  'knowledge',
  'education',
];

export function NewCampaignModal() {
  const router = useRouter();
  const isOpen = useCampaignsStore((state) => state.newCampaignModalOpen);
  const closeModal = useCampaignsStore((state) => state.closeNewCampaignModal);
  const createCampaign = useCampaignsStore((state) => state.createCampaign);
  const [selected, setSelected] = useState<CampaignArchetype | null>(null);
  const [brandName, setBrandName] = useState('');

  const resetForm = () => {
    setSelected(null);
    setBrandName('');
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const canCreate = selected !== null && brandName.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate || selected === null) return;
    const config = ARCHETYPE_CONFIGS[selected];
    // Seed the graph locally with deterministic prefixed IDs so the UI shows
    // the archetype shape immediately. The backend stores the full graph.
    const tempId = `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const seededNodes = structuredClone(config.defaultNodes).map((node) => ({
      ...node,
      id: `${tempId}-${node.id}`,
      parentId: node.parentId ? `${tempId}-${node.parentId}` : node.parentId,
    }));
    const seededEdges = structuredClone(config.defaultEdges).map((edge) => ({
      ...edge,
      id: `${tempId}-${edge.id}`,
      source: `${tempId}-${edge.source}`,
      target: `${tempId}-${edge.target}`,
    }));
    const campaign = await createCampaign({
      archetype: selected,
      brand_name: brandName.trim(),
      graph: { nodes: seededNodes, edges: seededEdges },
    });
    handleClose();
    router.push(`/canvas?campaign=${campaign.id}`);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="gs-card w-full max-w-3xl rounded-2xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  New campaign
                </div>
                <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                  Choose an archetype
                </h2>
              </div>
              <button
                type="button"
                className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={handleClose}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {ARCHETYPE_ORDER.map((id) => (
                <ArchetypeCard
                  key={id}
                  archetype={ARCHETYPE_CONFIGS[id]}
                  selected={selected === id}
                  onSelect={() => setSelected(id)}
                />
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm text-[var(--color-muted)]">
                Brand name
              </span>
              <input
                className="w-full rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
                placeholder="Acme Co."
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
              />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-black/10 px-4 py-2 text-sm text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[var(--color-dark)] px-4 py-2 text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canCreate}
                onClick={handleCreate}
              >
                Create campaign
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
