'use client';

import { useEffect, useState } from 'react';
import { scoreColor } from '@/lib/score-color';

interface NeuralScoreGaugeProps {
  score: number;
  threshold?: number;
  size?: number;
  label?: string;
}

const RADIUS = 80;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function NeuralScoreGauge({
  score,
  threshold = 72,
  size = 200,
  label = 'Neural Score',
}: NeuralScoreGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped, threshold);
  const offset =
    CIRCUMFERENCE - (mounted ? (clamped / 100) * CIRCUMFERENCE : 0);
  const viewBox = RADIUS * 2 + STROKE * 2;
  const center = viewBox / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
      >
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          stroke="rgba(26,26,26,0.08)"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-serif text-5xl font-semibold"
            style={{ color }}
          >
            {clamped.toFixed(1)}
          </span>
          <span className="text-sm text-[var(--color-muted)]">/100</span>
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {label}
        </div>
      </div>
    </div>
  );
}
