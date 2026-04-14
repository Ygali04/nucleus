import type {
  KeyMoment,
  MetricScore,
  ModalityContribution,
  NeuralScoreBreakdown,
  NeuroPeerReport,
} from '@/lib/types';

export interface ReportCampaignFixture {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    label: string;
    createdAt: string;
    report: NeuroPeerReport | null;
  }>;
}

const DIMENSION_META: Record<
  keyof Omit<NeuralScoreBreakdown, 'total'>,
  { brain_region: string; gtm_proxy: string; description: string }
> = {
  hook_score: {
    brain_region: 'V1 / Salience network',
    gtm_proxy: 'Thumb-stop rate',
    description: 'First 3 seconds of visual/auditory salience.',
  },
  sustained_attention: {
    brain_region: 'Dorsal attention network',
    gtm_proxy: 'Avg. watch time',
    description: 'Attention maintained across the full asset.',
  },
  emotional_resonance: {
    brain_region: 'Amygdala / vmPFC',
    gtm_proxy: 'Brand lift',
    description: 'Emotional arousal and affective peaks.',
  },
  memory_encoding: {
    brain_region: 'Hippocampus',
    gtm_proxy: 'Day-2 recall',
    description: 'Signals linked to episodic encoding.',
  },
  aesthetic_quality: {
    brain_region: 'Reward / OFC',
    gtm_proxy: 'Comment sentiment',
    description: 'Perceived craft and polish.',
  },
  cognitive_accessibility: {
    brain_region: 'Broca / Wernicke',
    gtm_proxy: 'Comprehension score',
    description: 'Ease of processing language and layout.',
  },
};

function buildMetrics(score: NeuralScoreBreakdown): MetricScore[] {
  return (Object.keys(DIMENSION_META) as Array<keyof typeof DIMENSION_META>).map(
    (key) => ({
      name: key,
      score: score[key],
      raw_value: score[key] / 100,
      ...DIMENSION_META[key],
    }),
  );
}

function buildCurve(
  length: number,
  base: number,
  amplitude: number,
  phase = 0,
): number[] {
  return Array.from({ length }, (_, index) => {
    const wave = Math.sin((index / length) * Math.PI * 2 + phase);
    const noise = Math.sin(index * 1.7 + phase) * 4;
    return Math.max(
      10,
      Math.min(95, Math.round(base + wave * amplitude + noise)),
    );
  });
}

function buildModalityBreakdown(length: number): ModalityContribution[] {
  return Array.from({ length }, (_, index) => {
    const visual = 40 + Math.sin(index / 4) * 15;
    const audio = 30 + Math.cos(index / 5) * 10;
    const text = Math.max(5, 100 - visual - audio);
    return {
      timestamp: index,
      visual: Math.round(visual),
      audio: Math.round(audio),
      text: Math.round(text),
    };
  });
}

function buildKeyMoments(curve: number[]): KeyMoment[] {
  const peakIdx = curve.indexOf(Math.max(...curve));
  const dipIdx = curve.indexOf(Math.min(...curve));
  return [
    {
      timestamp: 1.5,
      type: 'best_hook',
      label: 'Hook delivers the stat within 2s.',
      score: curve[1] ?? 70,
    },
    {
      timestamp: peakIdx,
      type: 'peak_engagement',
      label: 'Payoff beat lands with clear visual reveal.',
      score: curve[peakIdx] ?? 80,
    },
    {
      timestamp: dipIdx,
      type: 'dropoff_risk',
      label: 'Middle third loses attention — consider tightening.',
      score: curve[dipIdx] ?? 40,
    },
    {
      timestamp: Math.min(curve.length - 2, peakIdx + 4),
      type: 'emotional_peak',
      label: 'Emotional swell on testimonial callout.',
      score: 74,
    },
  ];
}

function buildReport(partial: {
  job_id: string;
  title: string;
  summary: string;
  action_items: string[];
  score: NeuralScoreBreakdown;
  contentGroupId?: string;
  parentJobId?: string;
}): NeuroPeerReport {
  const attention_curve = buildCurve(30, partial.score.sustained_attention, 18);
  const emotional_arousal_curve = buildCurve(
    30,
    partial.score.emotional_resonance,
    22,
    0.8,
  );
  const cognitive_load_curve = buildCurve(
    30,
    100 - partial.score.cognitive_accessibility,
    14,
    1.4,
  );
  return {
    job_id: partial.job_id,
    neural_score: partial.score,
    attention_curve,
    emotional_arousal_curve,
    cognitive_load_curve,
    metrics: buildMetrics(partial.score),
    key_moments: buildKeyMoments(attention_curve),
    modality_breakdown: buildModalityBreakdown(30),
    ai_summary: partial.summary,
    ai_action_items: partial.action_items,
    ai_report_title: partial.title,
    parent_job_id: partial.parentJobId,
    content_group_id: partial.contentGroupId,
  };
}

export const NEUROPEER_REPORT_FIXTURES: NeuroPeerReport[] = [
  buildReport({
    job_id: 'fixture-report-1',
    title: 'Hook A — cold open beats threshold',
    summary:
      'The cold open variant clears the 72 threshold on the strength of hook salience and sustained attention. Emotional resonance is the weakest dimension and should be the focus of the next edit pass.',
    action_items: [
      'Keep the current 0–2s frame composition; it is doing the work.',
      'Add a reaction cut around 0:12 to lift emotional resonance.',
      'Tighten the middle beat by ~1.2s to reduce the attention dip.',
    ],
    score: {
      total: 78.4,
      hook_score: 84.2,
      sustained_attention: 76.1,
      emotional_resonance: 68.9,
      memory_encoding: 74.5,
      aesthetic_quality: 81.3,
      cognitive_accessibility: 79.0,
    },
    contentGroupId: 'campaign-hook-ab',
  }),
  buildReport({
    job_id: 'fixture-report-2',
    title: 'Hook B — stat-led open underperforms',
    summary:
      'The stat-led open lags on hook score but holds memory encoding well. Neural signature suggests the payoff works, but viewers leave before reaching it.',
    action_items: [
      'Swap the opening stat for a visual reveal in the first second.',
      'Lead with the face, not the overlay text.',
      'Consider re-using this ending on a different hook.',
    ],
    score: {
      total: 63.7,
      hook_score: 55.8,
      sustained_attention: 61.4,
      emotional_resonance: 66.2,
      memory_encoding: 72.9,
      aesthetic_quality: 70.1,
      cognitive_accessibility: 65.4,
    },
    contentGroupId: 'campaign-hook-ab',
    parentJobId: 'fixture-report-1',
  }),
  buildReport({
    job_id: 'fixture-report-3',
    title: 'Pacing pass — middle beat tightened',
    summary:
      'Tightening the middle by 1.4s recovered sustained attention and lifted the composite by 6 points. The edit did not hurt memory encoding.',
    action_items: [
      'Promote this cut to the primary variant.',
      'Run one more pass on the outro CTA framing.',
      'Hold this pacing as the baseline for future edits.',
    ],
    score: {
      total: 81.9,
      hook_score: 82.0,
      sustained_attention: 85.7,
      emotional_resonance: 72.4,
      memory_encoding: 78.8,
      aesthetic_quality: 80.0,
      cognitive_accessibility: 82.1,
    },
    contentGroupId: 'campaign-pacing',
  }),
  buildReport({
    job_id: 'fixture-report-4',
    title: 'VO swap — warmer read',
    summary:
      'The warmer voice read improved emotional resonance without degrading clarity. Attention curve shows a stronger arousal peak around the midpoint.',
    action_items: [
      'Adopt the warmer read as the default for this archetype.',
      'Re-score against the ICP cohort before the next campaign cut.',
    ],
    score: {
      total: 74.6,
      hook_score: 71.2,
      sustained_attention: 73.4,
      emotional_resonance: 81.5,
      memory_encoding: 70.9,
      aesthetic_quality: 77.8,
      cognitive_accessibility: 74.0,
    },
    contentGroupId: 'campaign-vo-swap',
  }),
];

export const NEUROPEER_CAMPAIGN_FIXTURES: ReportCampaignFixture[] = [
  {
    id: 'campaign-hook-ab',
    name: 'Hook A/B — retention-first open',
    variants: [
      {
        id: 'fixture-report-1',
        label: 'Hook A — cold open',
        createdAt: '2026-04-10T14:22:00Z',
        report: NEUROPEER_REPORT_FIXTURES[0],
      },
      {
        id: 'fixture-report-2',
        label: 'Hook B — stat-led open',
        createdAt: '2026-04-10T16:41:00Z',
        report: NEUROPEER_REPORT_FIXTURES[1],
      },
    ],
  },
  {
    id: 'campaign-pacing',
    name: 'Pacing pass — middle beat',
    variants: [
      {
        id: 'fixture-report-3',
        label: 'Tightened middle v3',
        createdAt: '2026-04-11T09:14:00Z',
        report: NEUROPEER_REPORT_FIXTURES[2],
      },
    ],
  },
  {
    id: 'campaign-vo-swap',
    name: 'VO swap — warmer read',
    variants: [
      {
        id: 'fixture-report-4',
        label: 'Warmer read v1',
        createdAt: '2026-04-11T11:02:00Z',
        report: NEUROPEER_REPORT_FIXTURES[3],
      },
    ],
  },
];

export function findFixtureReport(id: string): NeuroPeerReport | null {
  return NEUROPEER_REPORT_FIXTURES.find((r) => r.job_id === id) ?? null;
}
