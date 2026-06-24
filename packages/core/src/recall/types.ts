import type { HybridQueryHit } from '../memory-engine/types.js';

/** Scored memory node for pack / decay / cold compression. */
export interface MemoryNode {
  id: string;
  content: string;
  /** Base relevance score (0–1). */
  relevance: number;
  /** ISO timestamp of last access. */
  lastAccessedAt?: string;
  /** ISO timestamp of creation. */
  createdAt?: string;
  /** Times retrieved or touched. */
  accessCount?: number;
  /** Optional weight multiplier. */
  weight?: number;
  /** Optional TTL expiry (ISO). Evicted when past. */
  expiresAt?: string;
  tags?: string[];
}

export interface HybridRecallOptions {
  limit?: number;
  vectorWeight?: number;
  graphWeight?: number;
  graphDepth?: number;
  /** Seed node IDs for graph expansion (e.g. graph node IDs). */
  graphSeeds?: string[];
}

export interface HybridRecallHit extends HybridQueryHit {
  graphScore?: number;
  vectorScore?: number;
  sources: Array<'vector' | 'bm25' | 'graph'>;
}

export interface HybridRecallResult {
  query: string;
  hits: HybridRecallHit[];
  tookMs: number;
  deduped: number;
}

export interface DecayScoreOptions {
  halfLifeHours?: number;
  now?: number;
  /** Query relevance multiplier (0–1). */
  relevance?: number;
}

export interface PackableMemory {
  id: string;
  content: string;
  /** Relevance score used for knapsack ratio. */
  relevance: number;
}

export interface PackResult {
  included: PackableMemory[];
  dropped: PackableMemory[];
  tokensUsed: number;
  tokensSaved: number;
  /** Original token count if all memories were included. */
  tokensTotal: number;
}

export interface SummarizeColdOptions {
  /** Age in hours after which a node is "cold". */
  coldAfterHours?: number;
  /** Max chars per compressed summary. */
  maxChars?: number;
  now?: number;
}

export interface ColdSummary {
  id: string;
  originalTokens: number;
  summary: string;
  summaryTokens: number;
  savedTokens: number;
}
