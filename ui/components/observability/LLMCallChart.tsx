'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function LLMCallChart({
  data,
}: {
  data: Array<{
    hour: string;
    minimax: number;
    anthropic: number;
    openrouter: number;
  }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#777' }} />
        <YAxis tick={{ fontSize: 11, fill: '#777' }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="minimax"
          stroke="var(--color-brass)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="anthropic"
          stroke="#777777"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="openrouter"
          stroke="#aaaaaa"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
