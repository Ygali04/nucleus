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
import type { CostHistoryPoint } from '@/lib/types';

export function CostChart({ data }: { data: CostHistoryPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="costGradient" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-brass)"
              stopOpacity={0.45}
            />
            <stop
              offset="95%"
              stopColor="var(--color-brass)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 11, fill: '#777' }}
          tickFormatter={(value) => value.slice(11, 16)}
        />
        <YAxis tick={{ fontSize: 11, fill: '#777' }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="var(--color-brass)"
          fill="url(#costGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
