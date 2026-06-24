import { estimateTokens } from '../proxy/compress-output.js';
import type { PackableMemory, PackResult } from './types.js';

type Scored = PackableMemory & { tokens: number; ratio: number };

function scoreMemory(m: PackableMemory): Scored {
  const tokens = Math.max(1, estimateTokens(m.content));
  return { ...m, tokens, ratio: m.relevance / tokens };
}

/** Trim content to fit a token budget while preserving head + tail signal. */
function trimToTokenBudget(content: string, maxTokens: number): string {
  const budget = Math.max(1, maxTokens);
  if (estimateTokens(content) <= budget) return content;

  const words = content.split(/\s+/);
  let lo = 1;
  let hi = words.length;
  let best = words.slice(0, 1).join(' ');

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const head = words.slice(0, Math.ceil(mid * 0.7)).join(' ');
    const tail = words.slice(-Math.floor(mid * 0.3)).join(' ');
    const candidate = `${head} … ${tail}`;
    if (estimateTokens(candidate) <= budget) {
      best = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best.length < content.length ? best : content.slice(0, Math.max(20, budget * 4));
}

/**
 * Greedy knapsack with trim-to-fit and local swap refinement.
 * Fits max-relevance memories into a token budget; partially includes high-value drops when budget remains.
 */
export function pack(memories: PackableMemory[], maxTokens: number): PackResult {
  if (memories.length === 0) {
    return { included: [], dropped: [], tokensUsed: 0, tokensSaved: 0, tokensTotal: 0 };
  }

  const tokensTotal = memories.reduce((s, m) => s + Math.max(1, estimateTokens(m.content)), 0);

  if (maxTokens <= 0) {
    return { included: [], dropped: [...memories], tokensUsed: 0, tokensSaved: tokensTotal, tokensTotal };
  }

  const scored = memories.map(scoreMemory).sort((a, b) => b.ratio - a.ratio || b.relevance - a.relevance);

  const included: PackableMemory[] = [];
  const dropped: Scored[] = [];
  let tokensUsed = 0;

  for (const item of scored) {
    if (tokensUsed + item.tokens <= maxTokens) {
      included.push({ id: item.id, content: item.content, relevance: item.relevance });
      tokensUsed += item.tokens;
    } else {
      dropped.push(item);
    }
  }

  // Trim-to-fit: use leftover budget on highest-ratio dropped items
  const remaining = maxTokens - tokensUsed;
  if (remaining >= 8 && dropped.length > 0) {
    for (const item of [...dropped].sort((a, b) => b.ratio - a.ratio)) {
      const trimmed = trimToTokenBudget(item.content, remaining);
      const trimmedTokens = estimateTokens(trimmed);
      if (trimmedTokens <= remaining && trimmedTokens >= 4) {
        included.push({ id: item.id, content: trimmed, relevance: item.relevance * 0.92 });
        tokensUsed += trimmedTokens;
        const idx = dropped.findIndex((d) => d.id === item.id);
        if (idx >= 0) dropped.splice(idx, 1);
        break;
      }
    }
  }

  // Local swap: replace a low-ratio included item with a higher-ratio dropped one
  if (dropped.length > 0 && included.length > 0) {
    const worstIdx = included.reduce(
      (acc, m, i, arr) => {
        const ratio = m.relevance / Math.max(1, estimateTokens(m.content));
        return ratio < acc.ratio ? { idx: i, ratio } : acc;
      },
      { idx: 0, ratio: Infinity },
    );
    const bestDrop = dropped.reduce((best, d) => (d.ratio > best.ratio ? d : best), dropped[0]!);
    const worstTokens = estimateTokens(included[worstIdx.idx]!.content);
    if (bestDrop.ratio > worstIdx.ratio * 1.15 && bestDrop.tokens <= worstTokens + (maxTokens - tokensUsed)) {
      tokensUsed -= worstTokens;
      dropped.push(scoreMemory(included[worstIdx.idx]!));
      included.splice(worstIdx.idx, 1);
      included.push({ id: bestDrop.id, content: bestDrop.content, relevance: bestDrop.relevance });
      tokensUsed += bestDrop.tokens;
      const dropIdx = dropped.findIndex((d) => d.id === bestDrop.id);
      if (dropIdx >= 0) dropped.splice(dropIdx, 1);
    }
  }

  return {
    included,
    dropped: dropped.map(({ id, content, relevance }) => ({ id, content, relevance })),
    tokensUsed,
    tokensSaved: Math.max(0, tokensTotal - tokensUsed),
    tokensTotal,
  };
}

/** Format token savings for CLI output. */
export function formatPackSavings(result: PackResult): string {
  const pct = result.tokensTotal > 0
    ? Math.round((result.tokensSaved / result.tokensTotal) * 100)
    : 0;
  return `context trimmed: ${result.tokensTotal.toLocaleString()} → ${result.tokensUsed.toLocaleString()} tokens (saved ${pct}%)`;
}
