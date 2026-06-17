import type { ParsedCall, ParsedImport, ParsedSymbol } from '../types.js';

export interface GoAstExtraction {
  imports: ParsedImport[];
  symbols: ParsedSymbol[];
  calls: ParsedCall[];
  exports: string[];
}

const CALL_SKIP = new Set([
  'if', 'for', 'switch', 'select', 'go', 'defer', 'return', 'make', 'new', 'len', 'cap',
  'append', 'copy', 'delete', 'panic', 'recover', 'print', 'println', 'close', 'complex',
]);

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function isExported(name: string): boolean {
  return name.length > 0 && name[0] === name[0]!.toUpperCase() && name[0] !== name[0]!.toLowerCase();
}

function pathBasename(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] ?? p;
}

function parseImportBlock(block: string): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const lineRe = /(?:(\w+)\s+)?["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(block)) !== null) {
    const alias = match[1];
    const source = match[2]!;
    imports.push({
      source,
      specifiers: [alias ?? pathBasename(source)],
      isTypeOnly: false,
    });
  }
  return imports;
}

export function extractGoAst(content: string): GoAstExtraction | null {
  try {
    const imports: ParsedImport[] = [];
    const symbols: ParsedSymbol[] = [];
    const calls: ParsedCall[] = [];
    const exports: string[] = [];

    const blockMatch = content.match(/import\s*\(([\s\S]*?)\)/);
    const blockStart = blockMatch?.index ?? -1;
    const blockEnd =
      blockMatch && blockStart >= 0 ? blockStart + blockMatch[0].length : -1;
    if (blockMatch) imports.push(...parseImportBlock(blockMatch[1]!));

    const singleRe = /import\s+(?:(\w+)\s+)?["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = singleRe.exec(content)) !== null) {
      const idx = match.index ?? 0;
      if (blockStart >= 0 && idx >= blockStart && idx < blockEnd) {
        continue;
      }
      imports.push({
        source: match[2]!,
        specifiers: [match[1] ?? pathBasename(match[2]!)],
        isTypeOnly: false,
      });
    }

    const funcRe = /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/gm;
    while ((match = funcRe.exec(content)) !== null) {
      const name = match[1]!;
      const exported = isExported(name);
      symbols.push({
        name,
        kind: 'function',
        startLine: lineOf(content, match.index),
        endLine: lineOf(content, match.index),
        isExported: exported,
        isDefaultExport: false,
      });
      if (exported) exports.push(name);
    }

    const structRe = /^type\s+(\w+)\s+struct\b/gm;
    while ((match = structRe.exec(content)) !== null) {
      const name = match[1]!;
      const exported = isExported(name);
      symbols.push({
        name,
        kind: 'class',
        startLine: lineOf(content, match.index),
        endLine: lineOf(content, match.index),
        isExported: exported,
        isDefaultExport: false,
      });
      if (exported) exports.push(name);
    }

    const ifaceRe = /^type\s+(\w+)\s+interface\b/gm;
    while ((match = ifaceRe.exec(content)) !== null) {
      const name = match[1]!;
      const exported = isExported(name);
      symbols.push({
        name,
        kind: 'interface',
        startLine: lineOf(content, match.index),
        endLine: lineOf(content, match.index),
        isExported: exported,
        isDefaultExport: false,
      });
      if (exported) exports.push(name);
    }

    const callRe = /\b([A-Za-z_][\w.]*)\s*\(/g;
    while ((match = callRe.exec(content)) !== null) {
      const callee = match[1]!;
      const base = callee.split('.')[0]!;
      if (CALL_SKIP.has(base)) continue;
      if (calls.length >= 400) break;
      calls.push({ callee, line: lineOf(content, match.index) });
    }

    return { imports, symbols, calls, exports };
  } catch {
    return null;
  }
}
