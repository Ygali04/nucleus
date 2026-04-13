'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ModalityContribution } from '@/lib/types';

interface ModalityBreakdownChartProps {
  data: ModalityContribution[];
}

const SERIES = [
  { key: 'visual', label: 'Visual', color: '#6366f1' },
  { key: 'audio', label: 'Audio', color: '#10b981' },
  { key: 'text', label: 'Text', color: '#f59e0b' },
] as const;

export function ModalityBreakdownChart({ data }: ModalityBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 11, fill: '#777' }}
          tickFormatter={(value: number) => `${value}s`}
        />
        <YAxis tick={{ fontSize: 11, fill: '#777' }} width={32} />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? value.toFixed(0) : String(value ?? '')
          }
          labelFormatter={(value) => `${value}s`}
        />
        <Legend verticalAlign="top" height={28} />
        {SERIES.map(({ key, label, color }) => (
          <Bar
            key={key}
            dataKey={key}
            name={label}
            stackId="modality"
            fill={color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
