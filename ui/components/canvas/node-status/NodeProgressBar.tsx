interface NodeProgressBarProps {
  percent: number | null | undefined;
  label?: string;
}

export function NodeProgressBar({ percent, label }: NodeProgressBarProps) {
  if (!percent) return null;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="relative mt-2 h-[3px] w-full overflow-hidden rounded-sm bg-zinc-100">
      <div
        className="h-full bg-[var(--color-primary)] transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
      {label ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] font-medium uppercase tracking-wider text-[var(--color-ink)]">
          {label}
        </div>
      ) : null}
    </div>
  );
}
