/**
 * Vercel AI SDK adapter — returns CoreMessage-compatible context blocks.
 * No @ai-sdk/* dependency; structural types only.
 */
import type { MnemosMemoryEngine } from '../memory-engine/engine.js';
import { pack, formatPackSavings } from '../recall/index.js';

export interface VercelAiMemoryOptions {
  tokenBudget?: number;
  role?: 'system' | 'user';
}

export interface VercelAiContextBlock {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Build context messages for Vercel AI SDK `generateText` / `streamText`. */
export async function buildVercelAiContext(
  engine: MnemosMemoryEngine,
  task: string,
  options: VercelAiMemoryOptions = {},
): Promise<{ messages: VercelAiContextBlock[]; savingsLine: string }> {
  const budget = options.tokenBudget ?? 8000;
  const role = options.role ?? 'system';
  const ctx = await engine.compileContext(task, budget);
  const packResult = pack(
    ctx.documents.map((d) => ({ id: d.id, content: d.content, relevance: d.score })),
    budget,
  );
  const content = [
    `# Repository Memory Context`,
    formatPackSavings(packResult),
    '',
    ctx.markdown,
  ].join('\n');

  return {
    messages: [{ role, content }],
    savingsLine: formatPackSavings(packResult),
  };
}
