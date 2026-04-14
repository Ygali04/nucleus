import { Sparkles } from 'lucide-react';

export const RUFLO_VIOLET = '#8b5cf6';

export function isRufloAdded(data: Record<string, unknown> | undefined): boolean {
  return Boolean(data && (data as { addedByRuflo?: boolean }).addedByRuflo);
}

export function rufloBorderColor(
  selected: boolean,
  ruflo: boolean,
): string {
  if (selected) return 'var(--color-primary)';
  if (ruflo) return RUFLO_VIOLET;
  return 'rgba(26,26,26,0.1)';
}

export const RUFLO_ARRIVAL_CLASS = 'nucleus-ruflo-arrival';

export function RufloBadge() {
  return (
    <span
      className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white"
      style={{ backgroundColor: RUFLO_VIOLET }}
      title="Added by Ruflo"
    >
      <Sparkles className="h-2.5 w-2.5" />
      Ruflo
    </span>
  );
}
