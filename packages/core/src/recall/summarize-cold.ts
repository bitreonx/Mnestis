import { estimateTokens } from '../proxy/compress-output.js';
import type { MemoryNode, SummarizeColdOptions, ColdSummary } from './types.js';

const DEFAULT_COLD_HOURS = 168; // 7 days

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our',
  'you', 'your', 'also', 'just', 'very', 'really', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'when', 'where', 'which', 'while',
]);

/**
 * Deterministic extractive compression for stale episodic memories (~65–85% token reduction).
 */
export function summarizeCold(
  nodes: MemoryNode[],
  opts: SummarizeColdOptions = {},
): ColdSummary[] {
  const coldAfter = opts.coldAfterHours ?? DEFAULT_COLD_HOURS;
  const maxChars = opts.maxChars ?? 200;
  const now = opts.now ?? Date.now();
  const coldMs = coldAfter * 3_600_000;

  const summaries: ColdSummary[] = [];

  for (const node of nodes) {
    const lastAccess = new Date(node.lastAccessedAt ?? node.createdAt ?? 0).getTime();
    if (now - lastAccess < coldMs) continue;

    const originalTokens = estimateTokens(node.content);
    const summary = extractiveSummary(node.content, node.tags, maxChars);
    const summaryTokens = estimateTokens(summary);

    summaries.push({
      id: node.id,
      originalTokens,
      summary,
      summaryTokens,
      savedTokens: Math.max(0, originalTokens - summaryTokens),
    });
  }

  return summaries;
}

function extractKeySignals(content: string): string[] {
  const signals = new Set<string>();

  for (const m of content.matchAll(/`([^`]+)`/g)) {
    if (m[1] && m[1].length <= 48) signals.add(m[1]);
  }
  for (const m of content.matchAll(/(?:\/|[A-Za-z]:\\)[\w./\\-]+\.(?:tsx?|jsx?|py|go|rs|java|rb|php|md)/g)) {
    const parts = m[0].replace(/\\/g, '/').split('/');
    signals.add(parts.slice(-2).join('/') || m[0]);
  }
  for (const m of content.matchAll(/\b(?:Error|TypeError|FAIL|Exception|bug|fix|decision|auth|API|MCP|test)\b[^\s,.]*/gi)) {
    if (m[0].length <= 32) signals.add(m[0]);
  }
  for (const m of content.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g)) {
    if (m[0].length <= 24) signals.add(m[0]);
  }

  return [...signals].slice(0, 5);
}

function extractiveSummary(content: string, tags: string[] | undefined, maxChars: number): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]?/g) ?? [clean];
  const first = sentences[0]?.trim() ?? clean;

  const keywords = [...new Set(
    clean
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
  )].slice(0, 4);

  const signals = extractKeySignals(clean);
  const tagSuffix = tags?.length ? `[${tags.slice(0, 3).join(', ')}]` : '';

  const parts: string[] = [];
  const headBudget = Math.floor(maxChars * 0.55);
  parts.push(first.slice(0, headBudget));

  if (signals.length > 0) {
    parts.push(`→ ${signals.join(', ')}`);
  } else if (keywords.length > 0) {
    parts.push(`→ ${keywords.join(', ')}`);
  }

  if (tagSuffix) parts.push(tagSuffix);

  let combined = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (combined.length > maxChars) {
    combined = combined.slice(0, maxChars - 1) + '…';
  } else if (combined.length < clean.length && !combined.endsWith('…')) {
    combined += '…';
  }

  return combined;
}
