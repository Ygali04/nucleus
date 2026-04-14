'use client';

export interface ProviderCard {
  id: string;
  label: string;
  costPerS?: number;
  disabled?: boolean;
}

export function ProviderCardGrid({
  providers,
  value,
  onChange,
}: {
  providers: readonly ProviderCard[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {providers.map((p) => {
        const active = p.id === value;
        const disabled = p.disabled ?? false;
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.id)}
            className={`flex flex-col items-start rounded-md border px-3 py-2 text-left transition ${
              active
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                : 'border-black/10 bg-white hover:bg-black/[0.03]'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <span
              className={`text-xs font-semibold ${
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink)]'
              }`}
            >
              {p.label}
            </span>
            <span className="mt-0.5 font-mono text-[10px] text-[var(--color-muted)]">
              {p.costPerS !== undefined ? `$${p.costPerS.toFixed(3)}/s` : '—'}
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[var(--color-faint)]">
              via ComfyUI
            </span>
          </button>
        );
      })}
    </div>
  );
}
