/**
 * OpenAI Agents SDK adapter — tool definition + handler for agent memory recall.
 * No openai/agents dep; JSON-schema compatible tool spec.
 */
import type { MnemosMemoryEngine } from '../memory-engine/engine.js';
import { pack, formatPackSavings } from '../recall/index.js';

export const OPENAI_AGENTS_MEMORY_TOOL = {
  type: 'function' as const,
  name: 'recall_memory',
  description: 'Hybrid vector+graph recall from local repository memory with token-budget packing.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural language recall query' },
      max_tokens: { type: 'number', description: 'Token budget for packed context' },
    },
    required: ['query'],
  },
};

export interface OpenAiAgentsRecallArgs {
  query: string;
  max_tokens?: number;
}

/** Handler for OpenAI Agents SDK tool calls. */
export async function handleOpenAiAgentsRecall(
  engine: MnemosMemoryEngine,
  args: OpenAiAgentsRecallArgs,
): Promise<{ content: string; savings: string }> {
  const budget = args.max_tokens ?? 4000;
  const ctx = await engine.compileContext(args.query, budget);
  const packResult = pack(
    ctx.documents.map((d) => ({ id: d.id, content: d.content, relevance: d.score })),
    budget,
  );
  const content = packResult.included.map((m) => `### ${m.id}\n${m.content}`).join('\n\n');
  return { content, savings: formatPackSavings(packResult) };
}
