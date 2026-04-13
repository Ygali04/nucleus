'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function TokenChart({
  data,
}: {
  data: Array<{ hour: string; input: number; output: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#777' }} />
        <YAxis tick={{ fontSize: 11, fill: '#777' }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="input"
          stroke="var(--color-primary)"
          fill="rgba(184,160,122,0.2)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="output"
          stroke="var(--color-primary-light)"
          fill="rgba(212,196,168,0.2)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
