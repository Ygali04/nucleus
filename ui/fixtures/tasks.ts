import type { Task } from '@/lib/types';

const now = Date.now();

function isoMinutesAgo(minutes: number) {
  return new Date(now - minutes * 60_000).toISOString();
}

const definitions = [
  [
    'task-001',
    'Analyze supply chain optimization opportunities',
    'ops-analysis',
    9,
    'active',
  ],
  [
    'task-002',
    'Prepare weekly portfolio health digest',
    'reporting',
    7,
    'completed',
  ],
  [
    'task-003',
    'Reconcile budget variance anomaly',
    'budget-variance',
    8,
    'failed',
  ],
  [
    'task-004',
    'Review vendor pricing concentration',
    'vendor-benchmarking',
    6,
    'completed',
  ],
  [
    'task-005',
    'Summarize competitive pricing shifts',
    'market-research',
    5,
    'completed',
  ],
  [
    'task-006',
    'Assess inventory turns by business unit',
    'working-capital',
    7,
    'active',
  ],
  [
    'task-007',
    'Draft transformation narrative for board deck',
    'strategy-formulation',
    6,
    'pending',
  ],
  [
    'task-008',
    'Review EBITDA bridge changes',
    'financial-metrics',
    7,
    'completed',
  ],
  [
    'task-009',
    'Prioritize cash unlock initiatives',
    'portfolio-optimization',
    6,
    'pending',
  ],
  [
    'task-010',
    'Risk-screen vendor consolidation move',
    'risk-analysis',
    8,
    'active',
  ],
  [
    'task-011',
    'Sync ERP cost center ingest',
    'erp-connector-agent',
    4,
    'failed',
  ],
  ['task-012', 'Create portfolio rebalancing summary', 'root', 5, 'completed'],
  ['task-013', 'Trace SG&A headcount variance', 'ops-analysis', 7, 'completed'],
  [
    'task-014',
    'Monitor commodity input price volatility',
    'market-research',
    4,
    'pending',
  ],
  ['task-015', 'Write procurement savings memo', 'reporting', 5, 'completed'],
  [
    'task-016',
    'Check AP aging deterioration',
    'working-capital',
    8,
    'completed',
  ],
  [
    'task-017',
    'Score downside scenario severity',
    'risk-analysis',
    6,
    'completed',
  ],
  ['task-018', 'Compose Friday executive email', 'reporting', 4, 'pending'],
  [
    'task-019',
    'Refresh board dashboard metrics',
    'financial-metrics',
    5,
    'completed',
  ],
  [
    'task-020',
    'Recommend top 3 cash initiatives',
    'portfolio-optimization',
    8,
    'completed',
  ],
  [
    'task-021',
    'Map process bottlenecks in plant ops',
    'ops-analysis',
    6,
    'pending',
  ],
  [
    'task-022',
    'Analyze pricing leakage by region',
    'market-research',
    7,
    'completed',
  ],
  [
    'task-023',
    'Compile risk note for supplier failure',
    'risk-analysis',
    7,
    'completed',
  ],
  [
    'task-024',
    'Validate reporting template updates',
    'reporting',
    3,
    'completed',
  ],
  [
    'task-025',
    'Survey working capital peer benchmarks',
    'working-capital',
    5,
    'completed',
  ],
  [
    'task-026',
    'Generate cost center outlier report',
    'financial-metrics',
    7,
    'completed',
  ],
  ['task-027', 'Review portfolio cadence schedule', 'root', 4, 'pending'],
  [
    'task-028',
    'Benchmark vendor payment terms',
    'vendor-benchmarking',
    5,
    'active',
  ],
  [
    'task-029',
    'Summarize pricing committee notes',
    'strategy-formulation',
    4,
    'completed',
  ],
  [
    'task-030',
    'Recover stale ERP connector health',
    'erp-connector-agent',
    3,
    'failed',
  ],
] as const;

export const dummyTasks: Task[] = definitions.map(
  ([id, title, assigned, priority, status], index) => {
    const createdAt = isoMinutesAgo(180 - index * 4);
    const startedAt =
      status === 'pending' ? undefined : isoMinutesAgo(170 - index * 4);
    const completedAt =
      status === 'completed' || status === 'failed'
        ? isoMinutesAgo(160 - index * 4)
        : undefined;

    return {
      id,
      title,
      instruction: `${title} and write a concise update for the operating team.`,
      assigned_to: assigned,
      created_by: index % 3 === 0 ? 'root' : 'system',
      priority,
      required_tools: ['read_file', 'assert_fact'],
      required_tags: ['finance'],
      context: {
        brief: 'Acme Launch Brief',
        stage: index % 2 === 0 ? 'generation' : 'scoring',
      },
      created_at: createdAt,
      started_at: startedAt,
      completed_at: completedAt,
      result:
        status === 'completed'
          ? 'Task completed successfully with updated report artifact.'
          : status === 'failed'
            ? 'Connector timeout blocked completion.'
            : undefined,
      status,
    };
  },
);
