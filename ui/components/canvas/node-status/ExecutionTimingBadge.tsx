interface ExecutionTimingBadgeProps {
  durationS: number;
  costUsd?: number;
  cached?: boolean;
}

export function ExecutionTimingBadge({
  durationS,
  costUsd,
  cached,
}: ExecutionTimingBadgeProps) {
  if (cached) {
    return (
      <span className="rounded-sm bg-amber-500/15 px-1 py-0.5 font-mono text-[11px] text-amber-700">
        ⚡ cached
      </span>
    );
  }

  const parts = [`${durationS.toFixed(1)}s`];
  if (costUsd !== undefined && costUsd !== null) {
    parts.push(`$${costUsd.toFixed(2)}`);
  }

  return (
    <span className="rounded-sm bg-black/[0.04] px-1 py-0.5 font-mono text-[11px] text-gray-600">
      {parts.join(' · ')}
    </span>
  );
}
