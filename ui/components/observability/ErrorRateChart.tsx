'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function ErrorRateChart({
  data,
}: {
  data: Array<{ hour: string; errors: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#777' }} />
        <YAxis tick={{ fontSize: 11, fill: '#777' }} />
        <Tooltip />
        <ReferenceLine
          y={3}
          stroke="var(--color-error)"
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="errors"
          stroke="var(--color-error)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
