import type { MemorySearchIndex } from '../search/index.js';
import { searchMemory } from '../search/index.js';
import type {
  HybridQueryHit,
  HybridQueryResult,
  LoadedEngineIndex,
  MemoryContradiction,
  MemoryDocument,
  TaskContextPack,
} from './types.js';
import type { MnemosGraph } from '../graph/graph.js';
import { cosineSimilarity } from './embeddings.js';
import { embedDocument, type EmbeddingMode } from './onnx-embeddings.js';
import { reciprocalRankFusion, rankHits, snippet } from './ranking.js';
import { attachQualityWarnings, formatWarningsMarkdown } from './quality-gate.js';
import { estimateTokens } from '../proxy/compress-output.js';
import { applyVeilToEpisodes } from './veil.js';
import { hybridRecall } from '../recall/hybrid-recall.js';
import { pack, formatPackSavings } from '../recall/pack.js';

export interface QueryOptions {
  limit?: number;
  kinds?: MemoryDocument['kind'][];
  minConfidence?: number;
  includeContradictions?: boolean;
  embeddingMode?: EmbeddingMode;
  veilPolicy?: import('./types.js').VeilPolicy | null;
}

function docById(index: LoadedEngineIndex): Map<string, MemoryDocument> {
  const map = new Map<string, MemoryDocument>();
  for (const d of index.documents) map.set(d.id, d);
  for (const ep of index.episodes) {
    map.set(ep.id, {
      id: ep.id,
      kind: 'episode',
      title: ep.content.slice(0, 80),
      body: ep.content,
      tags: ['episode', ...ep.tags],
      confidence: 0.7,
      contentHash: '',
      builtAt: ep.createdAt,
      weight: ep.weight,
      source: 'episode',
    });
  }
  return map;
}

async function vectorSearch(
  index: LoadedEngineIndex,
  query: string,
  limit: number,
  mode: EmbeddingMode = 'auto',
): Promise<{ hits: Array<{ id: string; score: number }>; backend: 'onnx' | 'hash' }> {
  const { vector, backend } = await embedDocument(query, mode);
  const scores: Array<{ id: string; score: number }> = [];

  for (const [id, vec] of index.vectors) {
    scores.push({ id, score: cosineSimilarity(vector, vec) });
  }

  return {
    hits: scores.sort((a, b) => b.score - a.score).slice(0, limit),
    backend,
  };
}

function bm25Search(
  searchIndex: MemorySearchIndex,
  query: string,
  limit: number,
): Array<{ id: string; score: number }> {
  const result = searchMemory(searchIndex, query, { limit });
  return result.hits.map((h) => ({ id: h.id, score: h.score }));
}

function toHit(
  doc: MemoryDocument,
  score: number,
  bm25Rank?: number,
  vectorRank?: number,
): HybridQueryHit {
  return {
    id: doc.id,
    kind: doc.kind,
    title: doc.title,
    snippet: snippet(doc.body),
    path: doc.path,
    score,
    bm25Rank,
    vectorRank,
    confidence: doc.confidence,
    weight: doc.weight,
    tags: doc.tags,
  };
}

export async function hybridQuery(
  index: LoadedEngineIndex,
  searchIndex: MemorySearchIndex,
  query: string,
  options: QueryOptions = {},
): Promise<HybridQueryResult> {
  const started = Date.now();
  const limit = options.limit ?? 12;
  const fetchLimit = Math.max(limit * 3, 24);
  const visibleEpisodes = applyVeilToEpisodes(index.episodes, options.veilPolicy ?? null);
  const visibleIds = new Set(visibleEpisodes.map((e) => e.id));
  const docs = docById({ ...index, episodes: visibleEpisodes });

  const bm25Hits = bm25Search(searchIndex, query, fetchLimit);
  const { hits: vectorHits, backend } = await vectorSearch(index, query, fetchLimit, options.embeddingMode);

  const bm25RankMap = new Map(bm25Hits.map((h, i) => [h.id, i + 1]));
  const vectorRankMap = new Map(vectorHits.map((h, i) => [h.id, i + 1]));

  const fused = reciprocalRankFusion([
    bm25Hits.map((h) => ({ id: h.id, score: h.score })),
    vectorHits.map((h) => ({ id: h.id, score: h.score })),
  ]);

  let hits: HybridQueryHit[] = fused
    .map((f) => {
      const doc = docs.get(f.id);
      if (!doc) return null;
      if (doc.kind === 'episode' && !visibleIds.has(f.id)) return null;
      if (options.kinds && !options.kinds.includes(doc.kind)) return null;
      if (options.minConfidence && doc.confidence < options.minConfidence) return null;
      return toHit(doc, f.score, bm25RankMap.get(f.id), vectorRankMap.get(f.id));
    })
    .filter((h): h is HybridQueryHit => h !== null);

  hits = rankHits(hits, { recencyBoost: true, builtAt: index.manifest.builtAt }).slice(0, limit);

  const contradictions =
    options.includeContradictions === false
      ? []
      : index.contradictions.filter((c) => !c.resolved).slice(0, 5);

  const base: HybridQueryResult = {
    query,
    hits,
    contradictions,
    tookMs: Date.now() - started,
    retrievers: { bm25: bm25Hits.length, vector: vectorHits.length, fused: hits.length },
    embeddingBackend: backend,
  };

  return attachQualityWarnings(base, index.manifest.stats.embeddingBackend ?? backend);
}

export async function compileTaskContext(
  index: LoadedEngineIndex,
  searchIndex: MemorySearchIndex,
  task: string,
  tokenBudget = 8000,
  embeddingMode?: EmbeddingMode,
  graph: MnemosGraph | null = null,
): Promise<TaskContextPack> {
  const recallResult = graph
    ? await hybridRecall(index, searchIndex, task, graph, { limit: 24 })
    : null;
  const result = recallResult
    ? {
        query: task,
        hits: recallResult.hits,
        contradictions: index.contradictions.filter((c) => !c.resolved).slice(0, 5),
        tookMs: recallResult.tookMs,
        retrievers: { bm25: 0, vector: 0, fused: recallResult.hits.length },
        warnings: undefined as HybridQueryResult['warnings'],
      }
    : await hybridQuery(index, searchIndex, task, { limit: 24, includeContradictions: true, embeddingMode });

  const candidates = result.hits
    .map((hit) => {
      const structural = index.documents.find((d) => d.id === hit.id);
      const episodic = index.episodes.find((e) => e.id === hit.id);
      const content = structural?.body ?? episodic?.content;
      if (!content) return null;
      return { id: hit.id, content, relevance: hit.score, hit, kind: hit.kind, title: hit.title };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const packResult = pack(
    candidates.map((c) => ({ id: c.id, content: c.content, relevance: c.relevance })),
    tokenBudget,
  );

  const includedIds = new Set(packResult.included.map((m) => m.id));
  const selected: TaskContextPack['documents'] = candidates
    .filter((c) => includedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      content: c.content.slice(0, Math.min(c.content.length, tokenBudget * 4)),
      score: c.relevance,
    }));

  const savingsPercent =
    packResult.tokensTotal > 0 ? Math.round((packResult.tokensSaved / packResult.tokensTotal) * 100) : 0;
  const savingsLine = formatPackSavings(packResult);

  const markdown = [
    `# Task Context: ${task}`,
    '',
    `> **${savingsLine}**`,
    '',
    `Budget: ${tokenBudget} tokens · Used: ${packResult.tokensUsed} · Included: ${packResult.included.length} · Dropped: ${packResult.dropped.length}`,
    graph ? '_Hybrid recall: vector + BM25 + graph BFS_' : '_Hybrid recall: vector + BM25_',
    '',
    ...(result.warnings?.length ? [formatWarningsMarkdown(result.warnings), ''] : []),
    ...(result.contradictions.length
      ? ['## ⚠ Contradictions detected', ...result.contradictions.map((c) => formatContradiction(c)), '']
      : []),
    '## Context',
    ...selected.map((d) => `### ${d.title} (${d.kind}, score ${d.score.toFixed(3)})\n${d.content.slice(0, 1200)}`),
  ].join('\n');

  return {
    task,
    tokenBudget,
    estimatedTokens: packResult.tokensUsed,
    documents: selected,
    contradictions: result.contradictions,
    markdown,
    pack: {
      tokensUsed: packResult.tokensUsed,
      tokensSaved: packResult.tokensSaved,
      tokensTotal: packResult.tokensTotal,
      savingsPercent,
      savingsLine,
      includedCount: packResult.included.length,
      droppedCount: packResult.dropped.length,
    },
  };
}

function formatContradiction(c: MemoryContradiction): string {
  return `- **${c.subject}** / ${c.predicate}: ${c.values.length} conflicting values (${c.severity})`;
}
