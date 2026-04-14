'use client';

import { useEffect, useMemo, useState } from 'react';
import { NeuroPeerReportView } from '@/components/reports/NeuroPeerReportView';
import { VariantComparisonView } from '@/components/reports/VariantComparisonView';
import {
  NEUROPEER_CAMPAIGN_FIXTURES,
  type ReportCampaignFixture,
} from '@/fixtures/neuropeer-reports';

type ViewMode = 'single' | 'compare';

export default function ReportsPage() {
  // TODO: replace with real campaigns/variants once backend /reports flows
  // through the campaigns store. For now show fixture data so the UI is real.
  const campaigns: ReportCampaignFixture[] = NEUROPEER_CAMPAIGN_FIXTURES;

  const [campaignId, setCampaignId] = useState<string | null>(
    campaigns[0]?.id ?? null,
  );
  const [variantId, setVariantId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId) ?? null,
    [campaigns, campaignId],
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
  }, [scoredVariants, variantId]);

  const activeVariant = scoredVariants.find((v) => v.id === variantId) ?? null;

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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (campaigns.length === 0) {
    return (
      <div className="p-10">
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">Reports</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          No scored variants yet. Run a campaign to generate neural reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Scoring
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">Reports</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Neural analysis from NeuroPeer for every scored variant.
        </p>
      </div>

      <div className="gs-card flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Campaign
          </span>
          <select
            value={campaignId ?? ''}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setVariantId(null);
              setCompareIds([]);
            }}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-[var(--color-ink)]"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          <div className="flex flex-wrap gap-2 border-b border-black/8 pb-3">
            {scoredVariants.map((variant) => {
              const active = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
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
          {activeVariant?.report ? (
            <NeuroPeerReportView report={activeVariant.report} />
          ) : (
            <div className="gs-card rounded-2xl px-5 py-10 text-center text-sm text-[var(--color-muted)]">
              Select a variant to view its neural report.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-black/8 pb-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Compare
            </span>
            {scoredVariants.map((variant) => {
              const selected = compareIds.includes(variant.id);
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => toggleCompareId(variant.id)}
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
          {comparisonEntries.length >= 2 ? (
            <VariantComparisonView entries={comparisonEntries} />
          ) : (
            <div className="gs-card rounded-2xl px-5 py-10 text-center text-sm text-[var(--color-muted)]">
              Select at least two variants to compare.
            </div>
          )}
        </>
      )}
    </div>
  );
}
