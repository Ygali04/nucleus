import type { CostHistoryPoint } from '@/lib/types';

const providers = ['MiniMax', 'Anthropic', 'OpenRouter'] as const;
const agents = [
  'root',
  'ops-analysis',
  'financial-metrics',
  'market-research',
  'reporting',
];

export const dummyCostHistory: CostHistoryPoint[] = Array.from(
  { length: 48 },
  (_, index) => {
    const timestamp = new Date(
      Date.now() - (47 - index) * 60 * 60_000,
    ).toISOString();
    const cost = Number(
      (0.04 + Math.sin(index / 3) * 0.01 + (index % 5) * 0.004).toFixed(3),
    );
    let cumulative = 0;

    for (let innerIndex = 0; innerIndex <= index; innerIndex += 1) {
      cumulative +=
        0.04 + Math.sin(innerIndex / 3) * 0.01 + (innerIndex % 5) * 0.004;
    }

    return {
      timestamp,
      cost,
      cumulative: Number(cumulative.toFixed(3)),
      tokens: 900 + index * 43,
      agent: agents[index % agents.length],
      provider: providers[index % providers.length],
    };
  },
);
