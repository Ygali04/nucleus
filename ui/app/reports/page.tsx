'use client';

import { useEffect, useMemo, useState } from 'react';
import { NeuroPeerReportView } from '@/components/reports/NeuroPeerReportView';
import { VariantComparisonView } from '@/components/reports/VariantComparisonView';
import { useNeuroPeerReport } from '@/hooks/useNeuroPeerReport';
import type { Campaign } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';

type ViewMode = 'single' | 'compare';

function hasScoredVariant(campaign: Campaign): boolean {
  return campaign.variants.some((variant) => variant.report !== null);
}

export default function ReportsPage() {
  const campaigns = useCampaignsStore((state) => state.campaigns);

  const scoredCampaigns = useMemo(
    () => campaigns.filter(hasScoredVariant),
    [campaigns],
  );

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  useEffect(() => {
    if (!campaignId && scoredCampaigns.length > 0) {
      setCampaignId(scoredCampaigns[0].id);
    }
  }, [scoredCampaigns, campaignId]);

  const activeCampaign = useMemo(
    () => scoredCampaigns.find((c) => c.id === campaignId) ?? null,
    [scoredCampaigns, campaignId],
  );

  const scoredVariants = useMemo(
    () => activeCampaign?.variants.filter((v) => v.report !== null) ?? [],
    [activeCampaign],
  );

  useEffect(() => {
    if (scoredVariants.length === 0) {
      setVariantId(null);
      setCompareIds([]);
      return;
    }
    if (!variantId || !scoredVariants.some((v) => v.id === variantId)) {
      setVariantId(scoredVariants[0].id);
    }
    setCompareIds((prev) =>
      prev.filter((id) => scoredVariants.some((v) => v.id === id)),
    );
  }, [scoredVariants, variantId]);

  const singleResult = useNeuroPeerReport(variantId);

  const comparisonEntries = useMemo(() => {
    if (!activeCampaign) return [];
    return compareIds
      .map((id) => {
        const variant = activeCampaign.variants.find((v) => v.id === id);
        if (!variant?.report) return null;
        return { variantId: id, label: variant.label, report: variant.report };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [activeCampaign, compareIds]);

  const canCompare = scoredVariants.length >= 2;

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Scoring
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Reports
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Neural analysis from NeuroPeer for every scored variant.
        </p>
      </div>

      {scoredCampaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="gs-card flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Campaign
              </span>
              <select
                value={campaignId ?? ''}
                onChange={(event) => {
                  setCampaignId(event.target.value);
                  setVariantId(null);
                  setCompareIds([]);
                }}
                className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-[var(--color-ink)]"
              >
                {scoredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>

            {canCompare ? (
              <div className="ml-auto inline-flex rounded-md border border-black/10 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`rounded px-3 py-1 transition ${
                    viewMode === 'single'
                      ? 'bg-[var(--color-dark)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compare')}
                  className={`rounded px-3 py-1 transition ${
                    viewMode === 'compare'
                      ? 'bg-[var(--color-dark)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Compare
                </button>
              </div>
            ) : null}
          </div>

          {viewMode === 'single' ? (
            <>
              <VariantTabs
                variants={scoredVariants.map((v) => ({ id: v.id, label: v.label }))}
                activeId={variantId}
                onSelect={setVariantId}
              />
              {singleResult.report ? (
                <NeuroPeerReportView report={singleResult.report} />
              ) : (
                <div className="gs-card rounded-2xl px-5 py-10 text-center text-sm text-[var(--color-muted)]">
                  Select a variant to view the neural report.
                </div>
              )}
            </>
          ) : (
            <>
              <CompareSelector
                variants={scoredVariants.map((v) => ({ id: v.id, label: v.label }))}
                selectedIds={compareIds}
                onToggle={toggleCompareId}
              />
              {comparisonEntries.length >= 2 ? (
                <VariantComparisonView entries={comparisonEntries} />
              ) : (
                <div className="gs-card rounded-2xl px-5 py-10 text-center text-sm text-[var(--color-muted)]">
                  Select at least two variants to compare.
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="gs-card rounded-2xl px-6 py-12 text-center">
      <h2 className="font-serif text-2xl text-[var(--color-ink)]">
        No scored variants yet
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--color-muted)]">
        When NeuroPeer scores a variant, it will show up here with its neural
        score, per-dimension breakdown, and AI-generated action items.
      </p>
    </div>
  );
}

interface VariantTabsProps {
  variants: Array<{ id: string; label: string }>;
  activeId: string | null;
  onSelect: (id: string) => void;
}

function VariantTabs({ variants, activeId, onSelect }: VariantTabsProps) {
  if (variants.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 border-b border-black/8 pb-3">
      {variants.map((variant) => {
        const active = variant.id === activeId;
        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              active
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-ink)]'
                : 'border-black/10 text-[var(--color-muted)] hover:border-black/20 hover:text-[var(--color-ink)]'
            }`}
          >
            {variant.label}
          </button>
        );
      })}
    </div>
  );
}

interface CompareSelectorProps {
  variants: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function CompareSelector({
  variants,
  selectedIds,
  onToggle,
}: CompareSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-black/8 pb-3">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Compare
      </span>
      {variants.map((variant) => {
        const selected = selectedIds.includes(variant.id);
        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onToggle(variant.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              selected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-ink)]'
                : 'border-black/10 text-[var(--color-muted)] hover:border-black/20 hover:text-[var(--color-ink)]'
            }`}
          >
            {variant.label}
          </button>
        );
      })}
    </div>
  );
}
