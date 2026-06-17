export interface CompressStats {
  originalChars: number;
  compressedChars: number;
  originalLines: number;
  compressedLines: number;
  estimatedOriginalTokens: number;
  estimatedCompressedTokens: number;
  savingsPercent: number;
}

export interface CompressOptions {
  maxLines?: number;
  maxLineLength?: number;
  dedupeConsecutive?: boolean;
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function collapseWhitespace(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

/**
 * RTK-style output compression for agent-facing command results.
 * Strips ANSI, dedupes noise, caps line count and width.
 */
export function compressCommandOutput(raw: string, options: CompressOptions = {}): { text: string; stats: CompressStats } {
  const maxLines = options.maxLines ?? 120;
  const maxLineLength = options.maxLineLength ?? 240;
  const dedupe = options.dedupeConsecutive !== false;

  const stripped = raw.replace(ANSI_RE, '');
  const lines = stripped.split(/\r?\n/);
  const out: string[] = [];
  let prev = '';

  for (const line of lines) {
    let trimmed = collapseWhitespace(line);
    if (!trimmed) continue;
    if (trimmed.length > maxLineLength) {
      trimmed = `${trimmed.slice(0, maxLineLength - 1)}…`;
    }
    if (dedupe && trimmed === prev) continue;
    out.push(trimmed);
    prev = trimmed;
    if (out.length >= maxLines) break;
  }

  const compressed = out.join('\n');
  const originalChars = stripped.length;
  const compressedChars = compressed.length;
  const estimatedOriginalTokens = estimateTokens(stripped);
  const estimatedCompressedTokens = estimateTokens(compressed);
  const savingsPercent =
    estimatedOriginalTokens > 0
      ? Math.round((1 - estimatedCompressedTokens / estimatedOriginalTokens) * 100)
      : 0;

  return {
    text: compressed,
    stats: {
      originalChars,
      compressedChars,
      originalLines: lines.length,
      compressedLines: out.length,
      estimatedOriginalTokens,
      estimatedCompressedTokens,
      savingsPercent,
    },
  };
}
