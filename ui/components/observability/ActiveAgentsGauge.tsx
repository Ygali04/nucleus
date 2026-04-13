'use client';

export function ActiveAgentsGauge({
  active,
  total,
}: {
  active: number;
  total: number;
}) {
  const ratio = total === 0 ? 0 : active / total;
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="flex h-full items-center justify-center">
      <svg viewBox="0 0 160 160" className="h-48 w-48">
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke="rgba(26,26,26,0.08)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 80 80)"
        />
        <text
          x="80"
          y="74"
          textAnchor="middle"
          className="fill-[var(--color-ink)] text-3xl font-serif"
        >
          {active}
        </text>
        <text
          x="80"
          y="98"
          textAnchor="middle"
          className="fill-[var(--color-muted)] text-[11px] uppercase tracking-[0.18em]"
        >
          of {total} active
        </text>
      </svg>
    </div>
  );
}
