/**
 * Thin LangChain adapter — wraps hybrid recall + pack for Runnable chains.
 * Zero runtime dependency on langchain; types are structural only.
 */
import type { HybridQueryResult, TaskContextPack } from '../memory-engine/types.js';
import type { MnemosMemoryEngine } from '../memory-engine/engine.js';
import { pack, formatPackSavings, type PackResult } from '../recall/index.js';

export interface LangChainMemoryInput {
  query: string;
  tokenBudget?: number;
}

export interface LangChainMemoryOutput {
  context: string;
  packResult: PackResult;
  queryResult: HybridQueryResult;
}

/** Runnable-compatible memory retriever (no @langchain/core dep). */
export async function createLangChainRetriever(engine: MnemosMemoryEngine) {
  return {
    name: 'mnestis-memory',
    description: 'Hybrid BM25+vector recall with token-budget packing',
    async invoke(input: LangChainMemoryInput): Promise<LangChainMemoryOutput> {
      const budget = input.tokenBudget ?? 4000;
      const ctx: TaskContextPack = await engine.compileContext(input.query, budget);
      const packResult = pack(
        ctx.documents.map((d) => ({ id: d.id, content: d.content, relevance: d.score })),
        budget,
      );
      return {
        context: ctx.markdown,
        packResult,
        queryResult: await engine.query(input.query),
      };
    },
    formatSavings: formatPackSavings,
  };
}
