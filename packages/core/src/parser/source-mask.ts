/** Comment/string masking profiles for lexical analysis. */
export type CommentStyle = 'c' | 'python' | 'haskell' | 'erlang' | 'lisp' | 'sql';

const COMMENT_STYLE_BY_LANGUAGE: Record<string, CommentStyle> = {
  python: 'python',
  ruby: 'python',
  shell: 'python',
  terraform: 'python',
  dockerfile: 'python',
  r: 'python',
  julia: 'python',
  yaml: 'python',
  perl: 'python',
  haskell: 'haskell',
  lua: 'haskell',
  sql: 'sql',
  erlang: 'erlang',
  prolog: 'erlang',
  clojure: 'lisp',
  racket: 'lisp',
  assembly: 'lisp',
};

export function getCommentStyle(language: string): CommentStyle {
  return COMMENT_STYLE_BY_LANGUAGE[language] ?? 'c';
}

export interface AnalyzableSource {
  /** Source after SFC script isolation (vue/svelte). Strings/comments preserved. */
  text: string;
  /** Same length as text; 1 = executable surface, 0 = comment/string/template noise. */
  codeMask: Uint8Array;
  /** Comment + string regions blanked — safe for call-graph heuristics. */
  callSafe: string;
  lines: string[];
}

/**
 * Build a lexical model of the file for structure extraction (imports/symbols)
 * and call-graph heuristics without destroying string literals.
 */
export function prepareAnalyzableSource(content: string, language: string): AnalyzableSource {
  let text = content;
  if (language === 'vue' || language === 'svelte') {
    text = maskOutsideScriptRegions(content, language);
  }

  const codeMask = buildCodeMask(text, getCommentStyle(language));
  markNonScriptMask(content, language, codeMask);

  const callSafe = blankByMask(text, codeMask);
  return { text, codeMask, callSafe, lines: content.split('\n') };
}

function markNonScriptMask(content: string, language: string, mask: Uint8Array): void {
  if (language !== 'vue' && language !== 'svelte') return;
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const scriptRanges: Array<{ start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(content)) !== null) {
    const bodyStart = match.index + match[0].indexOf(match[1]!);
    scriptRanges.push({ start: bodyStart, end: bodyStart + match[1]!.length });
  }
  if (scriptRanges.length === 0) return;

  for (let i = 0; i < content.length; i++) {
    const inScript = scriptRanges.some((r) => i >= r.start && i < r.end);
    if (!inScript) mask[i] = 0;
  }
}

/** Blank non-script regions but keep newlines so line numbers stay aligned. */
export function maskOutsideScriptRegions(content: string, language: 'vue' | 'svelte'): string {
  const chars = [...content];
  const regions: Array<{ start: number; end: number }> = [];
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(content)) !== null) {
    const bodyStart = match.index + match[0].indexOf(match[1]!);
    regions.push({ start: bodyStart, end: bodyStart + match[1]!.length });
  }

  if (regions.length === 0) return content;

  for (let i = 0; i < chars.length; i++) {
    const inRegion = regions.some((r) => i >= r.start && i < r.end);
    if (!inRegion && chars[i] !== '\n' && chars[i] !== '\r') {
      chars[i] = ' ';
    }
  }

  return chars.join('');
}

/** Mark comment and string regions as non-code (0). */
export function buildCodeMask(content: string, style: CommentStyle): Uint8Array {
  const mask = new Uint8Array(content.length).fill(1);
  let i = 0;

  while (i < content.length) {
    const ch = content[i]!;
    const next = content[i + 1];

    if (style === 'python') {
      if (ch === '"' && next === '"' && content[i + 2] === '"') {
        i = markTripleQuoted(mask, content, i, '"');
        continue;
      }
      if (ch === "'" && next === "'" && content[i + 2] === "'") {
        i = markTripleQuoted(mask, content, i, "'");
        continue;
      }
    }

    if (ch === '"' || ch === "'") {
      i = markString(mask, content, i);
      continue;
    }
    if (ch === '`') {
      i = markTemplateString(mask, content, i);
      continue;
    }

    if (style === 'c' && ch === '/' && next === '/') {
      i = markLineComment(mask, content, i);
      continue;
    }
    if (style === 'c' && ch === '/' && next === '*') {
      i = markBlockComment(mask, content, i);
      continue;
    }
    if ((style === 'python' || style === 'lisp') && ch === '#') {
      i = markLineComment(mask, content, i);
      continue;
    }
    if (style === 'haskell' && ch === '-' && next === '-') {
      i = markLineComment(mask, content, i);
      continue;
    }
    if (style === 'erlang' && ch === '%') {
      i = markLineComment(mask, content, i);
      continue;
    }
    if (style === 'lisp' && ch === ';') {
      i = markLineComment(mask, content, i);
      continue;
    }
    if (style === 'sql' && ch === '-' && next === '-') {
      i = markLineComment(mask, content, i);
      continue;
    }
    if (style === 'sql' && ch === '/' && next === '*') {
      i = markBlockComment(mask, content, i);
      continue;
    }

    i++;
  }

  return mask;
}

export function isMatchInCode(
  mask: Uint8Array,
  text: string,
  start: number,
  length: number,
): boolean {
  for (let i = start; i < start + length; i++) {
    const c = text[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue;
    if (!mask[i]) return false;
  }
  return true;
}

/** Import/resource lines include string literals — validate keyword prefix only. */
export function isImportMatchInCode(
  mask: Uint8Array,
  text: string,
  start: number,
  length: number,
): boolean {
  if (!mask[start]) return false;
  for (let i = start; i < start + length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') break;
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue;
    if (!mask[i]) return false;
  }
  return true;
}

function blankByMask(text: string, mask: Uint8Array): string {
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    if (!mask[i] && chars[i] !== '\n' && chars[i] !== '\r') {
      chars[i] = ' ';
    }
  }
  return chars.join('');
}

function markRange(mask: Uint8Array, start: number, end: number): number {
  for (let j = start; j < end; j++) mask[j] = 0;
  return end;
}

function markLineComment(mask: Uint8Array, content: string, start: number): number {
  let i = start;
  while (i < content.length && content[i] !== '\n') i++;
  return markRange(mask, start, i);
}

function markBlockComment(mask: Uint8Array, content: string, start: number): number {
  let i = start + 2;
  while (i < content.length - 1) {
    if (content[i] === '*' && content[i + 1] === '/') {
      return markRange(mask, start, i + 2);
    }
    i++;
  }
  return markRange(mask, start, content.length);
}

function markString(mask: Uint8Array, content: string, start: number): number {
  const quote = content[start]!;
  let i = start + 1;
  while (i < content.length) {
    if (content[i] === '\\') {
      i += 2;
      continue;
    }
    if (content[i] === quote) {
      return markRange(mask, start, i + 1);
    }
    i++;
  }
  return markRange(mask, start, content.length);
}

function markTripleQuoted(mask: Uint8Array, content: string, start: number, quote: string): number {
  let i = start + 3;
  while (i < content.length - 2) {
    if (content[i] === quote && content[i + 1] === quote && content[i + 2] === quote) {
      return markRange(mask, start, i + 3);
    }
    i++;
  }
  return markRange(mask, start, content.length);
}

function markTemplateString(mask: Uint8Array, content: string, start: number): number {
  let i = start + 1;
  while (i < content.length) {
    if (content[i] === '\\') {
      i += 2;
      continue;
    }
    if (content[i] === '`') {
      return markRange(mask, start, i + 1);
    }
    if (content[i] === '$' && content[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') depth--;
        i++;
      }
      continue;
    }
    i++;
  }
  return markRange(mask, start, content.length);
}

/** @deprecated Use prepareAnalyzableSource + callSafe */
export function maskCommentsAndStrings(content: string, style: CommentStyle): string {
  const mask = buildCodeMask(content, style);
  return blankByMask(content, mask);
}

export function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}
