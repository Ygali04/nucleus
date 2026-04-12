import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="gs-card rounded-2xl p-5">
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-[var(--color-muted)]">
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );
}
