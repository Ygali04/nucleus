'use client';

import { useState } from 'react';
import type { CampaignDeliverables } from '@/lib/api-client';

type Tab = 'gtm' | 'sop';

interface DeliveryReportProps {
  campaignId: string;
  brandName?: string;
  deliverables: CampaignDeliverables;
}

function downloadMarkdown(filename: string, body: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function MarkdownBlock({ body }: { body: string }) {
  // Keep this intentionally dependency-free so the UI builds whether or not
  // react-markdown is installed. A monospace <pre> preserves the doc's
  // structure well enough for reading + copy-paste, and the download button
  // delivers the raw markdown for any downstream consumer.
  return (
    <pre className="whitespace-pre-wrap break-words rounded-lg border border-black/10 bg-white px-4 py-4 font-mono text-[12.5px] leading-relaxed text-[var(--color-ink)]">
      {body}
    </pre>
  );
}

export function DeliveryReport({
  campaignId,
  brandName,
  deliverables,
}: DeliveryReportProps) {
  const [tab, setTab] = useState<Tab>('gtm');
  const gtm = deliverables.gtm_guide ?? '';
  const sop = deliverables.sop_doc ?? '';
  const summary = deliverables.strategy_summary ?? '';
  const generatedAt = deliverables.generated_at;
  const slug = (brandName ?? campaignId).replace(/[^a-zA-Z0-9-_]+/g, '_');

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="gs-card rounded-2xl border border-black/10 bg-[var(--color-primary-soft,#eef2ff)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Strategy Summary
          </div>
          <p className="mt-1 text-sm text-[var(--color-ink)]">{summary}</p>
          {generatedAt ? (
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              generated {new Date(generatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-black/10 bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab('gtm')}
            className={`rounded px-3 py-1 transition ${
              tab === 'gtm'
                ? 'bg-[var(--color-dark)] text-white'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            GTM Guide
          </button>
          <button
            type="button"
            onClick={() => setTab('sop')}
            className={`rounded px-3 py-1 transition ${
              tab === 'sop'
                ? 'bg-[var(--color-dark)] text-white'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            SOP
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              downloadMarkdown(`${slug}-gtm.md`, gtm || '# Empty GTM guide\n')
            }
            disabled={!gtm}
            className="rounded-md border border-black/10 bg-white px-3 py-1 text-[var(--color-ink)] hover:border-[var(--color-primary)] disabled:opacity-40"
          >
            Download GTM.md
          </button>
          <button
            type="button"
            onClick={() =>
              downloadMarkdown(`${slug}-sop.md`, sop || '# Empty SOP\n')
            }
            disabled={!sop}
            className="rounded-md border border-black/10 bg-white px-3 py-1 text-[var(--color-ink)] hover:border-[var(--color-primary)] disabled:opacity-40"
          >
            Download SOP.md
          </button>
        </div>
      </div>

      {tab === 'gtm' ? (
        gtm ? (
          <MarkdownBlock body={gtm} />
        ) : (
          <div className="gs-card rounded-2xl px-5 py-10 text-center text-sm text-[var(--color-muted)]">
            No GTM guide available yet.
          </div>
        )
      ) : sop ? (
        <MarkdownBlock body={sop} />
      ) : (
        <div className="gs-card rounded-2xl px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No SOP document available yet.
        </div>
      )}
    </div>
  );
}

export default DeliveryReport;
