#!/usr/bin/env node
/**
 * INFERNO verification harness — multi-signal scoring for codebase understanding.
 *
 * Engine stack (creative codenames):
 *   EMBER       — Exact Match Engine (word boundaries, paths, synonyms)
 *   BRIMSTONE   — Adversarial trap layer (forbidden, injection, homoglyphs)
 *   CINDER      — Anti-gaming detectors (keyword stuffing, empty shells)
 *   PANDEMONIUM — Intent-aware multi-signal fusion
 *   SPECTER     — Integrity manifests & path sandbox (see engines/specter.mjs)
 *
 * Design lineage: SWE-bench · HumanEval · MMLU · GAIA
 */
import { matchKeywords, matchPaths, normalizeText } from './engines/ember.mjs';
import { runBrimstone } from './engines/brimstone.mjs';
import { runCinder } from './engines/cinder.mjs';
import { fuseSignals, tierFromScore } from './engines/pandemonium.mjs';

export const INFERNO_VERSION = '1.1.0';
export const DATASET_VERSION = '1.0.0';

export { normalizeText } from './engines/ember.mjs';
export { buildIntegrityManifest, verifyIntegrityManifest, assertSafeRepoId } from './engines/specter.mjs';

/**
 * Score one task answer against ground-truth rubric.
 * required = ALL must match. required_any = OR (min_required_any hits).
 */
export function scoreTask(text, rubric = {}, options = {}) {
  const {
    required_keywords: required = [],
    required_any = [],
    forbidden_keywords: forbidden = [],
    forbidden_any = [],
    forbidden_domains = [],
    required_paths = [],
    min_required_any = 1,
    intent = options.intent ?? 'default',
  } = rubric;

  const allForbidden = [...forbidden, ...forbidden_any, ...forbidden_domains];
  const brimstone = runBrimstone(text, allForbidden);
  const norm = brimstone.norm;

  const rubricKeywords = [...required, ...required_any, ...required_paths];
  const cinder = runCinder(text, rubricKeywords);

  const signals = [];

  const requiredHits = matchKeywords(norm, required);
  const requiredScore =
    required.length === 0 ? 100 : Math.round((requiredHits.length / required.length) * 100);
  if (required.length > 0) {
    signals.push({
      id: 'keywords_required',
      engine: 'EMBER',
      score: requiredScore,
      hits: requiredHits,
      total: required.length,
    });
  }

  let anyHits = [];
  if (required_any.length > 0) {
    anyHits = matchKeywords(norm, required_any);
    const anyScore =
      anyHits.length >= min_required_any
        ? 100
        : Math.round((anyHits.length / Math.max(min_required_any, 1)) * 100);
    signals.push({
      id: 'keywords_any',
      engine: 'EMBER',
      score: Math.min(100, anyScore),
      hits: anyHits,
      total: required_any.length,
      min: min_required_any,
    });
  }

  const pathHits = matchPaths(norm, required_paths);
  const pathScore =
    required_paths.length === 0 ? 100 : Math.round((pathHits.length / required_paths.length) * 100);
  if (required_paths.length > 0) {
    signals.push({
      id: 'paths',
      engine: 'EMBER',
      score: pathScore,
      hits: pathHits,
      total: required_paths.length,
    });
  }

  if (allForbidden.length > 0) {
    signals.push({
      id: 'brimstone',
      engine: 'BRIMSTONE',
      score: brimstone.trapTriggered ? 0 : 100,
      hits: [...brimstone.forbiddenHits, ...brimstone.injectionHits],
      total: allForbidden.length,
    });
  }

  const activeSignals = signals.length > 0 ? signals : [{ id: 'empty_rubric', engine: 'EMBER', score: 100 }];
  const { composite } = fuseSignals(activeSignals, intent);
  const totalPenalty = brimstone.penalty + cinder.penalty;
  const accuracy = Math.max(0, composite - totalPenalty);

  const anyOk = required_any.length === 0 || anyHits.length >= min_required_any;
  const pathsOk = required_paths.length === 0 || pathScore === 100;
  const forbiddenOk = !brimstone.trapTriggered;
  const requiredOk = required.length === 0 || requiredScore === 100;
  const cinderOk = !cinder.gamingDetected;

  const verifiedGates = [requiredOk, anyOk, pathsOk, forbiddenOk, cinderOk];
  const gates = { requiredOk, anyOk, pathsOk, forbiddenOk, cinderOk };
  const verified = accuracy >= 95 && verifiedGates.every(Boolean);

  return {
    accuracy,
    verified,
    coverage: requiredHits.length + anyHits.length + pathHits.length,
    required_hits: requiredHits,
    required_any_hits: anyHits,
    path_hits: pathHits,
    forbidden_hits: brimstone.forbiddenHits,
    injection_hits: brimstone.injectionHits,
    penalty: totalPenalty,
    signals: activeSignals,
    engines: {
      ember: { requiredHits, anyHits, pathHits },
      brimstone: { trapTriggered: brimstone.trapTriggered, injectionHits: brimstone.injectionHits },
      cinder: { gamingDetected: cinder.gamingDetected, stuffing: cinder.stuffing, shell: cinder.shell },
      pandemonium: { composite, intent },
    },
    verification_tier: tierFromScore(accuracy, gates, verifiedGates),
    gates,
  };
}

/** Score AI context export (task6 — PHOENIX PACK trial). */
export function scoreContextPackage(contextMeta, rawRepo, rubric = {}) {
  const requiredArtifacts = rubric.required_artifacts ?? ['project.dna.json', 'agent_context.json'];
  const minCompression = rubric.min_compression ?? 2;
  const maxTokens = rubric.max_tokens ?? 500_000;

  const sizes = contextMeta.sizes ?? {};
  const present = requiredArtifacts.filter((f) => (sizes[f] ?? 0) > 0);
  const artifactScore = Math.round((present.length / requiredArtifacts.length) * 100);

  const hasArchitecture = Object.keys(sizes).some((k) => k.includes('context/architecture'));
  const compression =
    rawRepo.tokens > 0 && contextMeta.tokens > 0 ? rawRepo.tokens / contextMeta.tokens : 0;
  const withinBudget = contextMeta.tokens > 0 && contextMeta.tokens <= maxTokens;

  const compressionOk = compression >= minCompression;
  const artifactsOk = present.length === requiredArtifacts.length;
  const accuracy = Math.round(
    (artifactScore + (compressionOk ? 100 : Math.min(100, compression * 20))) / 2,
  );

  const verified = artifactsOk && compressionOk && withinBudget;

  return {
    accuracy,
    verified,
    verification_tier: verified ? 'A' : accuracy >= 80 ? 'B' : 'F',
    compression_ratio: Math.round(compression * 10) / 10,
    artifacts_present: present,
    has_architecture_context: hasArchitecture,
    tokens: contextMeta.tokens,
    within_budget: withinBudget,
    gates: { artifactsOk, compressionOk, withinBudget },
    engines: { trial: 'PHOENIX_PACK', intent: 'context_export' },
  };
}

/** Aggregate per-task scores into run-level verification. */
export function aggregateVerification(taskScores) {
  if (taskScores.length === 0) {
    return {
      accuracy: 0,
      verified: false,
      verification_tier: 'F',
      tasks_verified: 0,
      tasks_total: 0,
      min_task_accuracy: 0,
    };
  }

  const accuracies = taskScores.map((t) => t.accuracy);
  const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const allVerified = taskScores.every((t) => t.verified);
  const minAccuracy = Math.min(...accuracies);
  const verifiedCount = taskScores.filter((t) => t.verified).length;

  let tier = 'F';
  if (allVerified && minAccuracy >= 95) tier = 'A';
  else if (avg >= 80 && minAccuracy >= 70) tier = 'B';
  else if (avg >= 50) tier = 'C';

  return {
    accuracy: Math.round(avg * 10) / 10,
    verified: allVerified && minAccuracy >= 95,
    verification_tier: tier,
    tasks_verified: verifiedCount,
    tasks_total: taskScores.length,
    min_task_accuracy: minAccuracy,
  };
}

/** Search digest text for ground-truth keywords (fair Gitingest baseline). */
export function scoreDigestSearch(digestText, groundTruth) {
  const taskDefs = [
    { gt: groundTruth.task1_login_start, intent: 'auth_entry' },
    { gt: groundTruth.task2_impact, intent: 'impact' },
    { gt: groundTruth.task3_explain, intent: 'overview' },
    { gt: groundTruth.task4_critical, intent: 'critical' },
    { gt: groundTruth.task5_capabilities, intent: 'list_capabilities' },
  ].filter((t) => t.gt);

  const scores = taskDefs.map(({ gt, intent }) => scoreTask(digestText, { ...gt, intent }));
  return aggregateVerification(scores);
}

/** Score external model submission (ASHES format). */
export function scoreSubmission(answers, groundTruth) {
  const trials = [
    { id: 'task1_login_start', intent: 'auth_entry' },
    { id: 'task2_impact', intent: 'impact' },
    { id: 'task3_explain', intent: 'overview' },
    { id: 'task4_critical', intent: 'critical' },
    { id: 'task5_capabilities', intent: 'list_capabilities' },
  ];

  const taskScores = trials.map(({ id, intent }) => {
    const answer = answers[id] ?? answers[id.replace('task', 'task')] ?? '';
    return scoreTask(answer, { ...(groundTruth[id] ?? {}), intent });
  });

  return { ...aggregateVerification(taskScores), per_task: taskScores };
}
