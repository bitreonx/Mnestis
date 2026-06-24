import type { MemoryNode, DecayScoreOptions } from './types.js';
import { DEFAULT_HALF_LIFE_HOURS, MIN_EPISODE_WEIGHT } from '../memory-engine/decay.js';

/**
 * INTENT: Score a memory node by recency × frequency × relevance for ranking/eviction.
 * INPUT: MemoryNode + optional halfLife, now, relevance override.
 * OUTPUT: 0–1 score; nodes below MIN_EPISODE_WEIGHT should be evicted.
 * STEPS: exp decay on last-access → log boost on accessCount → multiply relevance → apply weight/TTL.
 * COMPLEXITY: O(1)
 */
export function decayScore(node: MemoryNode, opts: DecayScoreOptions = {}): number {
  const now = opts.now ?? Date.now();
  const halfLife = opts.halfLifeHours ?? DEFAULT_HALF_LIFE_HOURS;
  const lambda = Math.LN2 / halfLife;

  if (node.expiresAt && new Date(node.expiresAt).getTime() < now) return 0;

  const lastAccess = node.lastAccessedAt ?? node.createdAt ?? new Date(now).toISOString();
  const created = node.createdAt ?? lastAccess;
  const hoursSinceAccess = (now - new Date(lastAccess).getTime()) / 3_600_000;
  const hoursSinceCreate = (now - new Date(created).getTime()) / 3_600_000;

  const recency = Math.exp(-lambda * hoursSinceAccess);
  const createDecay = Math.exp(-lambda * 0.25 * hoursSinceCreate);
  const frequency = 1 + Math.log1p(node.accessCount ?? 0) * 0.15;
  const relevance = opts.relevance ?? node.relevance;
  const weight = node.weight ?? 1;

  return weight * recency * createDecay * frequency * relevance;
}

/** Returns nodes that should be evicted (score below threshold). */
export function evictByDecay(
  nodes: MemoryNode[],
  opts: DecayScoreOptions = {},
): { kept: MemoryNode[]; evicted: MemoryNode[] } {
  const kept: MemoryNode[] = [];
  const evicted: MemoryNode[] = [];
  for (const n of nodes) {
    if (decayScore(n, opts) < MIN_EPISODE_WEIGHT) evicted.push(n);
    else kept.push(n);
  }
  return { kept, evicted };
}
