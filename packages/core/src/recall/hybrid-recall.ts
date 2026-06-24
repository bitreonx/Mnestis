import type { MemorySearchIndex } from '../search/index.js';
import type { LoadedEngineIndex } from '../memory-engine/types.js';
import type { MnemosGraph } from '../graph/graph.js';
import { bfsPaths } from '../graph/graph.js';
import { hybridQuery } from '../memory-engine/retrieval.js';
import { reciprocalRankFusion } from '../memory-engine/ranking.js';
import type { HybridRecallHit, HybridRecallOptions, HybridRecallResult } from './types.js';

const DEFAULT_VECTOR_WEIGHT = 0.55;
const DEFAULT_GRAPH_WEIGHT = 0.45;

/**
 * INTENT: Hybrid recall — vector cosine + BM25 + graph BFS expansion, weighted merge, dedup.
 * INPUT: query, engine index, search index, optional code graph, options.
 * OUTPUT: ranked HybridRecallHit[] with source attribution.
 * STEPS: hybridQuery → seed graph BFS from top hits → RRF merge → dedup by id → re-rank.
 * COMPLEXITY: O(V + E) for BFS on bounded depth + O(n log n) fusion.
 */
export async function hybridRecall(
  index: LoadedEngineIndex,
  searchIndex: MemorySearchIndex,
  query: string,
  graph: MnemosGraph | null = null,
  options: HybridRecallOptions = {},
): Promise<HybridRecallResult> {
  const started = Date.now();
  const limit = options.limit ?? 12;
  const vectorWeight = options.vectorWeight ?? DEFAULT_VECTOR_WEIGHT;
  const graphWeight = options.graphWeight ?? DEFAULT_GRAPH_WEIGHT;
  const graphDepth = options.graphDepth ?? 3;

  const base = await hybridQuery(index, searchIndex, query, {
    limit: Math.max(limit * 2, 24),
    includeContradictions: false,
  });

  const hitMap = new Map<string, HybridRecallHit>();
  for (const h of base.hits) {
    hitMap.set(h.id, {
      ...h,
      vectorScore: h.vectorRank ? 1 / h.vectorRank : h.score,
      graphScore: 0,
      sources: h.bm25Rank && h.vectorRank ? ['bm25', 'vector'] : h.vectorRank ? ['vector'] : ['bm25'],
    });
  }

  let graphHits: Array<{ id: string; score: number }> = [];
  if (graph) {
    graphHits = expandGraphScores(graph, base.hits, options.graphSeeds, graphDepth);
    for (const gh of graphHits) {
      const existing = hitMap.get(gh.id);
      if (existing) {
        existing.graphScore = gh.score;
        if (!existing.sources.includes('graph')) existing.sources.push('graph');
        existing.score = existing.score * vectorWeight + gh.score * graphWeight;
      } else {
        hitMap.set(gh.id, {
          id: gh.id,
          kind: 'fact',
          title: gh.id,
          snippet: gh.id,
          score: gh.score * graphWeight,
          graphScore: gh.score,
          confidence: 0.5,
          weight: 1,
          tags: ['graph-expanded'],
          sources: ['graph'],
        });
      }
    }
  }

  const merged = reciprocalRankFusion([
    base.hits.map((h) => ({ id: h.id, score: h.score })),
    graphHits.map((h) => ({ id: h.id, score: h.score })),
  ]);

  const deduped = merged.length - hitMap.size;
  const hits: HybridRecallHit[] = merged
    .slice(0, limit)
    .map((m) => hitMap.get(m.id))
    .filter((h): h is HybridRecallHit => h !== undefined);

  return {
    query,
    hits,
    tookMs: Date.now() - started,
    deduped: Math.max(0, deduped),
  };
}

/** BFS from seed nodes; score = 1 / (1 + hop distance). */
function expandGraphScores(
  graph: MnemosGraph,
  seeds: Array<{ id: string; score: number; path?: string }>,
  explicitSeeds: string[] | undefined,
  depth: number,
): Array<{ id: string; score: number }> {
  const scores = new Map<string, number>();

  const seedIds = new Set<string>(explicitSeeds ?? []);
  for (const s of seeds.slice(0, 5)) {
    if (s.path) {
      const nodeId = findGraphNodeByPath(graph, s.path);
      if (nodeId) seedIds.add(nodeId);
    }
  }

  if (seedIds.size === 0) {
    graph.forEachNode((id) => {
      if (seedIds.size >= 3) return;
      seedIds.add(id);
    });
  }

  for (const seed of seedIds) {
    if (!graph.hasNode(seed)) continue;
    scores.set(seed, Math.max(scores.get(seed) ?? 0, 1));
    const reachable = bfsPaths(graph, seed, depth);
    for (const [nodeId, path] of reachable) {
      const hopScore = 1 / path.length;
      scores.set(nodeId, Math.max(scores.get(nodeId) ?? 0, hopScore));
    }
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

function findGraphNodeByPath(graph: MnemosGraph, filePath: string): string | null {
  let found: string | null = null;
  graph.forEachNode((id, attrs) => {
    if (found) return;
    const p = (attrs as { path?: string }).path;
    if (p && (p === filePath || p.endsWith(filePath) || filePath.endsWith(p))) found = id;
  });
  return found;
}

/** Lightweight personalized PageRank on a small subgraph (power iteration). */
export function personalizedPageRank(
  graph: MnemosGraph,
  seedIds: string[],
  opts: { iterations?: number; damping?: number } = {},
): Map<string, number> {
  const iterations = opts.iterations ?? 20;
  const damping = opts.damping ?? 0.85;
  const nodes: string[] = [];
  graph.forEachNode((id) => nodes.push(id));

  const scores = new Map<string, number>();
  const seedSet = new Set(seedIds.filter((id) => graph.hasNode(id)));
  const seedWeight = seedSet.size > 0 ? 1 / seedSet.size : 0;

  for (const id of nodes) scores.set(id, seedSet.has(id) ? seedWeight : 0);

  for (let i = 0; i < iterations; i++) {
    const next = new Map<string, number>();
    for (const id of nodes) next.set(id, seedSet.has(id) ? (1 - damping) * seedWeight : 0);

    for (const id of nodes) {
      const outDeg = graph.outDegree(id);
      if (outDeg === 0) continue;
      const share = (scores.get(id) ?? 0) * damping / outDeg;
      for (const neighbor of graph.outNeighbors(id)) {
        next.set(neighbor, (next.get(neighbor) ?? 0) + share);
      }
    }
    for (const id of nodes) scores.set(id, next.get(id) ?? 0);
  }

  return scores;
}
