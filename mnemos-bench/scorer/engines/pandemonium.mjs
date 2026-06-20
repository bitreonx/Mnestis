/**
 * PANDEMONIUM — Pattern AND Navigation Detection Engine for Objective Module Intelligence Understanding Metrics.
 * Intent-aware multi-signal fusion for INFERNO task scoring.
 */
export const INTENT_WEIGHTS = {
  auth_entry: { keywords_required: 1.3, keywords_any: 1.0, paths: 1.6, brimstone: 1.4 },
  impact: { keywords_required: 1.4, keywords_any: 1.1, paths: 1.2, brimstone: 1.2 },
  overview: { keywords_required: 1.2, keywords_any: 1.0, paths: 0.8, brimstone: 1.5 },
  critical: { keywords_required: 1.2, keywords_any: 1.1, paths: 1.3, brimstone: 1.2 },
  list_capabilities: { keywords_required: 0.9, keywords_any: 1.4, paths: 0.7, brimstone: 1.3 },
  context_export: { keywords_required: 1.0, keywords_any: 1.0, paths: 1.0, brimstone: 1.0 },
  default: { keywords_required: 1.0, keywords_any: 1.0, paths: 1.2, brimstone: 1.2 },
};

export const TASK_INTENT_MAP = {
  task1_login_start: 'auth_entry',
  task2_impact: 'impact',
  task3_explain: 'overview',
  task4_critical: 'critical',
  task5_capabilities: 'list_capabilities',
  task6_context: 'context_export',
};

export function fuseSignals(signals, intent = 'default') {
  const weights = INTENT_WEIGHTS[intent] ?? INTENT_WEIGHTS.default;
  if (signals.length === 0) return { composite: 100, weights_used: weights };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const sig of signals) {
    const w = weights[sig.id] ?? 1;
    weightedSum += sig.score * w;
    totalWeight += w;
  }

  return {
    composite: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0,
    weights_used: weights,
  };
}

export function tierFromScore(accuracy, gates, verifiedGates) {
  const allGates = verifiedGates.every(Boolean);
  if (accuracy >= 95 && allGates) return 'A';
  if (accuracy >= 80 && gates.forbiddenOk) return 'B';
  if (accuracy >= 50) return 'C';
  return 'F';
}
