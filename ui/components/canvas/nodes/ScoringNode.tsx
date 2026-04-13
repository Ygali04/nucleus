'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Brain } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { scoreColor } from '@/lib/score-color';
import { useCanvasStore } from '@/store/canvas-store';
import { useCampaignsStore } from '@/store/campaigns-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';

interface ScoringData {
  neuralScore?: number | null;
  threshold?: number;
  topMetrics?: Array<{ name: string; score: number }>;
  iterationCount?: number;
  scoreDelta?: number | null;
}

const GAUGE_RADIUS = 32;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

export function ScoringNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as ScoringData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);
  const openReport = useCampaignsStore((s) => s.openReportForIteration);

  const hasScore = d.neuralScore !== null && d.neuralScore !== undefined;
  const score = hasScore ? (d.neuralScore as number) : 0;
  const threshold = d.threshold ?? 72;
  const color = scoreColor(score, threshold);
  const offset = GAUGE_CIRCUMFERENCE - (score / 100) * GAUGE_CIRCUMFERENCE;
  const weakest = (d.topMetrics ?? [])
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const handleCardClick = (e: MouseEvent) => {
    e.stopPropagation();
    openNodeModal(id);
  };

  const handleReportClick = (e: MouseEvent) => {
    e.stopPropagation();
    openReport(id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="gs-card relative min-w-[232px] max-w-[232px] cursor-pointer rounded-xl border bg-white px-3 py-3"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <NodeActionsMenu nodeId={id} kind="scoring" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center justify-between gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-[var(--color-primary)]" />
          <span>Neural Score</span>
        </div>
        {d.iterationCount ? (
          <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-[var(--color-primary)]">
            iter {d.iterationCount}
          </span>
        ) : null}
      </div>

      <div className="mb-2 flex items-center gap-3">
        <svg width="72" height="72" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r={GAUGE_RADIUS} fill="none" stroke="#e6e8ec" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={GAUGE_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={hasScore ? offset : GAUGE_CIRCUMFERENCE}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
          <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
            {hasScore ? score.toFixed(1) : '—'}
          </text>
        </svg>

        <div className="min-w-0 flex-1 space-y-1">
          {weakest.length > 0 ? (
            weakest.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-[10px]">
                <span className="truncate text-[var(--color-muted)]">{m.name}</span>
                <span className="ml-1 font-mono" style={{ color: scoreColor(m.score, threshold) }}>
                  {m.score.toFixed(0)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-[var(--color-muted)]">
              {hasScore ? 'No metric breakdown' : 'Not scored yet'}
            </div>
          )}
        </div>
      </div>

      {d.scoreDelta !== null && d.scoreDelta !== undefined ? (
        <div className="mb-2 text-[11px]">
          <span className={d.scoreDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            {d.scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(d.scoreDelta).toFixed(1)}
          </span>
          <span className="ml-1 text-[var(--color-muted)]">vs previous</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-1.5">
        <NodeStatusChip status={node.status} text={node.statusText} />
        {hasScore ? (
          <button
            type="button"
            onClick={handleReportClick}
            className="text-[11px] font-medium text-[var(--color-primary)] hover:underline"
          >
            Open report
          </button>
        ) : null}
      </div>
    </div>
  );
}
