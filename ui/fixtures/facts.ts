import type { Fact } from '@/lib/types';

const factKeys = [
  'portfolio_revenue_trend',
  'sgna_ratio',
  'inventory_turns',
  'ap_aging_risk',
  'vendor_spend_concentration',
  'pricing_leakage_signal',
  'budget_variance_flag',
  'working_capital_priority',
  'labor_productivity_delta',
  'portfolio_rebalancing_needed',
  'market_pricing_shift',
  'commodity_input_risk',
  'cash_conversion_cycle',
  'headcount_efficiency',
  'regional_margin_gap',
  'supplier_failure_risk',
  'forecast_confidence',
  'asset_allocation_imbalance',
  'report_delivery_due',
  'data_quality_warning',
];

export const dummyFacts: Fact[] = factKeys.map((key, index) => ({
  key,
  value:
    index % 4 === 0
      ? `${12 + index}%`
      : index % 4 === 1
        ? Math.round(20 + index * 1.5)
        : index % 4 === 2
          ? index % 2 === 0
          : `Signal ${index + 1}`,
  claimed_by:
    index % 3 === 0
      ? 'financial-metrics'
      : index % 3 === 1
        ? 'ops-analysis'
        : 'market-research',
  timestamp: new Date(Date.now() - index * 20 * 60_000).toISOString(),
  evidence:
    'Derived from the latest portfolio refresh and agent reconciliation sweep.',
  verified: index % 5 !== 0,
  ttl_minutes: 1_440,
  supersedes: index > 5 && index % 6 === 0 ? factKeys[index - 5] : undefined,
}));
