import type { AgentDefinition } from '@/lib/types';

const now = Date.now();

function minutesAgo(minutes: number) {
  return new Date(now - minutes * 60_000).toISOString();
}

/**
 * Fixture for the Nucleus agent hierarchy.
 *
 * Roles:
 *   - root           orchestrator "queen" that drives the recursive
 *                    generate → score → edit → re-score loop
 *   - market-research audience / ICP / archetype analysis
 *   - ops-analysis    creative variation (alt hooks, pacing, CTAs)
 *   - financial-metrics performance scoring (TRIBE v2 neural score)
 *   - portfolio-optimization post-loop GTM strategist
 *   - risk-analysis   emotional response predictor
 *   - reporting       performance dashboard + variant reports
 *   - strategy-formulation video brief generator
 *   - vendor-benchmarking provider/model benchmarking for video+audio gen
 *   - working-capital render-budget governance
 *   - budget-variance    edit-primitive executor (8 Nucleus edits)
 *   - erp-connector-agent  storage + CDN connector for variants
 */
export const dummyAgents: AgentDefinition[] = [
  {
    id: 'root',
    prompt:
      'Orchestrate video generation, scoring, and variant selection. Drive the recursive generate → score → edit loop until neural score >= threshold.',
    tools: ['*'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.4,
      max_tokens: 8192,
      max_iterations: 12,
      permissions: 'admin',
      tags: ['orchestration', 'pipeline', 'queen'],
    },
    state: {
      status: 'running',
      last_run: minutesAgo(1),
      total_cost_usd: 1.84,
      run_count: 97,
      modifications_today: 1,
      modifications_date: new Date(now).toISOString().slice(0, 10),
    },
    memory: 'Pipeline orchestrator memory',
    depth: 0,
  },
  {
    id: 'market-research',
    prompt:
      'Analyze the target audience: pull ICP traits, dominant archetypes, cultural signals, and competitor creative, then surface a concise audience brief the generator can consume.',
    tools: ['read_file', 'web_search', 'assert_fact'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.5,
      max_tokens: 4096,
      max_iterations: 10,
      permissions: 'analyst',
      tags: ['audience', 'icp', 'archetype'],
      parent: 'root',
    },
    state: {
      status: 'idle',
      last_run: minutesAgo(7),
      total_cost_usd: 0.42,
      run_count: 48,
      modifications_today: 0,
    },
    memory: 'Audience analysis memory',
    depth: 1,
  },
  {
    id: 'ops-analysis',
    prompt:
      'Produce creative variations of the current brief: alternate hooks, pacing, CTAs, and scene ordering the generator can render into fresh variants.',
    tools: ['read_file', 'create_task', 'assert_fact'],
    config: {
      model: 'anthropic/claude-sonnet',
      temperature: 0.4,
      max_tokens: 4096,
      max_iterations: 9,
      permissions: 'analyst',
      tags: ['creative', 'variation', 'hooks'],
      parent: 'root',
    },
    state: {
      status: 'running',
      last_run: minutesAgo(2),
      total_cost_usd: 0.66,
      run_count: 41,
      modifications_today: 0,
    },
    memory: 'Creative variation memory',
    depth: 1,
  },
  {
    id: 'financial-metrics',
    prompt:
      'Run TRIBE v2 neural scoring on every rendered variant. Return neural score, per-metric breakdown, and a pass/fail decision against the threshold.',
    tools: ['read_file', 'assert_fact', 'check_facts'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.2,
      max_tokens: 4096,
      max_iterations: 8,
      permissions: 'operator',
      tags: ['scoring', 'tribe', 'neural-score'],
      parent: 'root',
    },
    state: {
      status: 'idle',
      last_run: minutesAgo(18),
      total_cost_usd: 0.71,
      run_count: 52,
      modifications_today: 0,
    },
    memory: 'Scoring engine memory',
    depth: 1,
  },
  {
    id: 'portfolio-optimization',
    prompt:
      'Post-loop GTM strategist: rank winning variants, recommend placement mix, budget pacing, and multi-variant test sequencing for the creator team.',
    tools: ['read_file', 'create_task', 'send_message'],
    config: {
      model: 'anthropic/claude-sonnet',
      temperature: 0.3,
      max_tokens: 8192,
      max_iterations: 12,
      permissions: 'analyst',
      tags: ['gtm', 'placement', 'strategy'],
      parent: 'root',
    },
    state: {
      status: 'idle',
      last_run: minutesAgo(22),
      total_cost_usd: 0.33,
      run_count: 19,
      modifications_today: 0,
    },
    memory: 'GTM strategist memory',
    depth: 1,
  },
  {
    id: 'risk-analysis',
    prompt:
      'Predict emotional response to each variant: valence, arousal, likely brand-safety risk, and which archetypes will disengage.',
    tools: ['read_file', 'web_search', 'assert_fact'],
    config: {
      model: 'openrouter/openai/gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 4096,
      max_iterations: 8,
      permissions: 'analyst',
      tags: ['emotion', 'brand-safety'],
    },
    state: {
      status: 'running',
      last_run: minutesAgo(4),
      total_cost_usd: 0.55,
      run_count: 36,
      modifications_today: 0,
    },
    memory: 'Emotional response memory',
    depth: 0,
  },
  {
    id: 'reporting',
    prompt:
      'Build variant performance dashboards and creator-ready reports: neural score trends, top-performing hooks, and per-archetype engagement forecasts.',
    tools: ['read_file', 'write_file', 'check_outbox'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.4,
      max_tokens: 8192,
      max_iterations: 10,
      permissions: 'operator',
      tags: ['reporting', 'dashboards'],
    },
    state: {
      status: 'idle',
      last_run: minutesAgo(11),
      total_cost_usd: 0.29,
      run_count: 26,
      modifications_today: 0,
    },
    memory: 'Performance dashboard memory',
    depth: 0,
  },
  {
    id: 'strategy-formulation',
    prompt:
      'Generate the video brief: hook, beats, visual style, voice, pacing, and CTA. Consumes the brand KB + audience analysis and emits a brief the generator can render.',
    tools: ['read_file', 'create_task', 'assert_fact'],
    config: {
      model: 'anthropic/claude-sonnet',
      temperature: 0.5,
      max_tokens: 8192,
      max_iterations: 12,
      permissions: 'analyst',
      tags: ['brief', 'storyboard', 'generator'],
    },
    state: {
      status: 'idle',
      last_run: minutesAgo(24),
      total_cost_usd: 0.37,
      run_count: 21,
      modifications_today: 0,
    },
    memory: 'Video brief memory',
    depth: 0,
  },
  {
    id: 'vendor-benchmarking',
    prompt:
      'Benchmark video + audio generation providers (Kling, Runway, Veo, ElevenLabs, Suno). Surface per-model cost, latency, and neural-score lift.',
    tools: ['read_file', 'assert_fact', 'send_message'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.3,
      max_tokens: 4096,
      max_iterations: 8,
      permissions: 'analyst',
      tags: ['providers', 'benchmarks'],
      parent: 'ops-analysis',
    },
    state: {
      status: 'idle',
      last_run: minutesAgo(34),
      total_cost_usd: 0.18,
      run_count: 15,
      modifications_today: 0,
    },
    memory: 'Provider benchmarking memory',
    depth: 2,
  },
  {
    id: 'working-capital',
    prompt:
      'Track per-variant render spend and surface the cheapest path to a passing neural score. Recommend which edit primitives to reuse vs regenerate.',
    tools: ['read_file', 'assert_fact', 'check_facts'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.2,
      max_tokens: 4096,
      max_iterations: 8,
      permissions: 'analyst',
      tags: ['render-budget', 'cost-guard'],
      parent: 'financial-metrics',
    },
    state: {
      status: 'running',
      last_run: minutesAgo(3),
      total_cost_usd: 0.22,
      run_count: 18,
      modifications_today: 0,
    },
    memory: 'Render budget memory',
    depth: 2,
  },
  {
    id: 'budget-variance',
    prompt:
      'Apply Nucleus edit primitives (hook rewrite, pacing tighten, B-roll swap, caption pass, CTA swap, voice swap, music swap, scene reorder) to low-scoring variants. Flag primitives that fail to lift the score.',
    tools: ['read_file', 'assert_fact', 'create_task'],
    config: {
      model: 'openrouter/openai/gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 4096,
      max_iterations: 8,
      permissions: 'analyst',
      tags: ['editor', 'primitives'],
      parent: 'financial-metrics',
    },
    state: {
      status: 'error',
      last_run: minutesAgo(28),
      total_cost_usd: 0.09,
      run_count: 7,
      modifications_today: 0,
      last_error: 'Remotion render adapter timeout while applying hook rewrite',
    },
    memory: 'Edit primitive memory',
    depth: 2,
  },
  {
    id: 'erp-connector-agent',
    prompt:
      'Bridge external creator-platform connectors (CDN, storage, Meta, TikTok) into the shared context and publish winning variants for delivery.',
    tools: ['connector:query_storage', 'assert_fact', 'send_message'],
    config: {
      model: 'minimax/minimax-m2.5',
      temperature: 0.1,
      max_tokens: 4096,
      max_iterations: 6,
      permissions: 'operator',
      tags: ['connector', 'delivery'],
      parent: 'root',
    },
    state: {
      status: 'disabled',
      last_run: minutesAgo(90),
      total_cost_usd: 0.02,
      run_count: 3,
      modifications_today: 0,
      last_error: 'Connector unavailable in demo mode',
    },
    memory: 'Delivery connector memory',
    depth: 1,
  },
];
