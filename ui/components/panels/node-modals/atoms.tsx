'use client';

import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {label}
        </span>
        {hint ? (
          <span className="font-mono text-[11px] text-[var(--color-muted)]">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function RadioRow<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: Array<{ value: T; label: string; description?: string; icon?: ReactNode }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <label
            key={o.value}
            title={o.description}
            className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-black/10 bg-white text-[var(--color-ink)] hover:bg-black/[0.03]'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span className="inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className = '', ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`min-h-[96px] w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none ${className}`}
    />
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none ${className}`}
    />
  );
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[var(--color-primary)]"
    />
  );
}
