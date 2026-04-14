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

interface CurveStackChartProps {
  attention: number[];
  emotionalArousal: number[];
  cognitiveLoad: number[];
}

const SERIES = [
  { key: 'attention', label: 'Attention', color: '#6366f1' },
  { key: 'emotional_arousal', label: 'Emotional Arousal', color: '#f59e0b' },
  { key: 'cognitive_load', label: 'Cognitive Load', color: '#f43f5e' },
] as const;

export function CurveStackChart({
  attention,
  emotionalArousal,
  cognitiveLoad,
}: CurveStackChartProps) {
  const length = Math.max(
    attention.length,
    emotionalArousal.length,
    cognitiveLoad.length,
  );
  const data = Array.from({ length }, (_, index) => ({
    second: index,
    attention: attention[index] ?? null,
    emotional_arousal: emotionalArousal[index] ?? null,
    cognitive_load: cognitiveLoad[index] ?? null,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(26,26,26,0.08)" vertical={false} />
        <XAxis
          dataKey="second"
          tick={{ fontSize: 11, fill: '#777' }}
          tickFormatter={(value: number) => `${value}s`}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#777' }}
          width={32}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? value.toFixed(1) : String(value ?? '')
          }
          labelFormatter={(value) => `${value}s`}
        />
        <Legend verticalAlign="top" height={28} iconType="plainline" />
        {SERIES.map(({ key, label, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
