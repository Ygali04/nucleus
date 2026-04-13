'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function TaskChart({
  data,
}: {
  data: Array<{ hour: string; completed: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#777' }} />
        <YAxis tick={{ fontSize: 11, fill: '#777' }} />
        <Tooltip />
        <Bar
          dataKey="completed"
          fill="var(--color-primary)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
