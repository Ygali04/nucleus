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

const DESCRIPTION_MIN = 20;
const DEFAULT_THRESHOLD = 72;
const DEFAULT_MAX_ITERATIONS = 3;
const DEFAULT_VARIANTS_REQUIRED = 3;
const DEFAULT_COST_CEILING = 5;

export function NewCampaignModal() {
  const router = useRouter();
  const isOpen = useCampaignsStore((state) => state.newCampaignModalOpen);
  const closeModal = useCampaignsStore((state) => state.closeNewCampaignModal);
  const createCampaign = useCampaignsStore((state) => state.createCampaign);
  const [selected, setSelected] = useState<CampaignArchetype | null>(null);
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [maxIterations, setMaxIterations] = useState<number>(
    DEFAULT_MAX_ITERATIONS,
  );
  const [variantsRequired, setVariantsRequired] = useState<number>(
    DEFAULT_VARIANTS_REQUIRED,
  );
  const [costCeiling, setCostCeiling] = useState<number>(DEFAULT_COST_CEILING);
  const [rufloAutopilot, setRufloAutopilot] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const resetForm = () => {
    setSelected(null);
    setBrandName('');
    setDescription('');
    setThreshold(DEFAULT_THRESHOLD);
    setMaxIterations(DEFAULT_MAX_ITERATIONS);
    setVariantsRequired(DEFAULT_VARIANTS_REQUIRED);
    setCostCeiling(DEFAULT_COST_CEILING);
    setRufloAutopilot(true);
    setAdvancedOpen(false);
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const trimmedDescription = description.trim();
  const canCreate =
    selected !== null &&
    brandName.trim().length > 0 &&
    trimmedDescription.length >= DESCRIPTION_MIN;

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
      brief: {
        description: trimmedDescription,
        threshold,
        maxIterations,
        variantsRequired,
        costCeiling,
        rufloAutopilot,
        // Keep legacy key so any existing backend/agent consumer still sees it.
        ruflo_autopilot: rufloAutopilot,
      },
    });
    handleClose();
    router.push(`/canvas?campaign=${campaign.id}`);
  };

  const descriptionTooShort =
    trimmedDescription.length > 0 && trimmedDescription.length < DESCRIPTION_MIN;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="gs-card max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6"
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

            <label className="mt-4 block">
              <span className="mb-2 flex items-center justify-between text-sm text-[var(--color-muted)]">
                <span>
                  Describe your campaign{' '}
                  <span className="text-[var(--color-primary)]">*</span>
                </span>
                <span
                  className={`text-[11px] ${
                    descriptionTooShort
                      ? 'text-red-500'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  {trimmedDescription.length}/{DESCRIPTION_MIN} min
                </span>
              </span>
              <textarea
                className="min-h-[110px] w-full resize-y rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
                placeholder="e.g. A 15-second hero ad for a meditation app targeting Gen Z TikTok users. Voice should be calm, authoritative. Emphasize the 'guided session' feature."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.015]">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.02]"
                onClick={() => setAdvancedOpen((v) => !v)}
              >
                <span className="font-medium">Advanced</span>
                <span className="text-xs text-[var(--color-muted)]">
                  {advancedOpen ? 'Hide' : 'Show'}
                </span>
              </button>
              {advancedOpen ? (
                <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 flex items-center justify-between text-xs text-[var(--color-muted)]">
                      <span>Neural score threshold</span>
                      <span className="font-mono text-[var(--color-ink)]">
                        {threshold}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={50}
                      max={95}
                      step={1}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full accent-[var(--color-primary)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-[var(--color-muted)]">
                      Max iterations / variant
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={maxIterations}
                      onChange={(e) =>
                        setMaxIterations(
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-[var(--color-muted)]">
                      Variants required to pass
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={variantsRequired}
                      onChange={(e) =>
                        setVariantsRequired(
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-xs text-[var(--color-muted)]">
                      Cost ceiling per campaign (USD)
                    </span>
                    <div className="flex items-center rounded-lg border border-black/10 bg-white px-3 py-2">
                      <span className="mr-2 text-sm text-[var(--color-muted)]">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={costCeiling}
                        onChange={(e) =>
                          setCostCeiling(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            <label className="mt-4 flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <input
                type="checkbox"
                checked={rufloAutopilot}
                onChange={(event) => setRufloAutopilot(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span>Let Ruflo auto-build the pipeline</span>
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
