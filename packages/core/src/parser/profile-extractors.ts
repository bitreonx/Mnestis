import type { ParsedCall, ParsedImport, ParsedSymbol } from '../types.js';
import type { ExtractorProfile, ImportRule, SymbolRule } from '../languages/registry.js';
import { lineNumberAt, isMatchInCode, isImportMatchInCode } from './source-mask.js';

const RESERVED_SYMBOLS = new Set([
  'if', 'for', 'while', 'switch', 'case', 'else', 'return', 'new', 'delete',
  'class', 'interface', 'struct', 'enum', 'type', 'module', 'package', 'import',
  'export', 'from', 'as', 'def', 'fn', 'fun', 'func', 'let', 'var', 'const',
  'void', 'int', 'float', 'bool', 'string', 'char', 'long', 'short', 'double',
  'public', 'private', 'protected', 'static', 'async', 'await', 'use', 'with',
  'procedure', 'function', 'sub', 'end', 'begin', 'do', 'then', 'when', 'match',
  'where', 'data', 'instance', 'trait', 'impl', 'pub', 'mut', 'self', 'super',
  'this', 'true', 'false', 'null', 'nil', 'none', 'some', 'ok', 'err', 'in',
  'is', 'not', 'and', 'or', 'xor', 'try', 'catch', 'finally', 'throw', 'raise',
  'yield', 'break', 'continue', 'goto', 'sizeof', 'typeof', 'instanceof',
  'namespace', 'using', 'include', 'require', 'library', 'source', 'resource',
  'data', 'variable', 'output', 'provider', 'terraform', 'module', 'run', 'from',
  'copy', 'workdir', 'expose', 'volume', 'add', 'set', 'echo', 'exit',
]);

const CALL_SKIP = new Set([
  ...RESERVED_SYMBOLS,
  'print', 'println', 'printf', 'console', 'log', 'debug', 'info', 'warn', 'error',
]);

function pathBasename(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] ?? p;
}

function lastSegment(p: string, sep: '/' | '.'): string {
  const parts = p.split(sep);
  return parts[parts.length - 1] ?? p;
}

function isValidSymbolName(name: string, kind: ParsedSymbol['kind']): boolean {
  if (!name || name.length > 120) return false;
  if (RESERVED_SYMBOLS.has(name.toLowerCase())) return false;
  if (kind === 'function' && /^[A-Z]/.test(name) && !name.includes('_')) return false;
  if (!/^[\w$:-]+(\.[\w$:-]+)*$/.test(name)) return false;
  return true;
}

function isExternalImportSource(source: string): boolean {
  const s = source.trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return false;
  if (/^(std|core|builtin|System|java\.|javax\.|scala\.|kotlin\.)/i.test(s)) return false;
  return true;
}

function resolveSpecifiers(
  source: string,
  specifiersRaw: string | undefined,
  defaultKind: ImportRule['specifiersDefault'],
): string[] {
  if (specifiersRaw) {
    return specifiersRaw
      .split(/[,;\s]+/)
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  switch (defaultKind) {
    case 'basename':
      return [pathBasename(source)];
    case 'last-segment':
      return [lastSegment(source, source.includes('/') ? '/' : '.')];
    case 'wildcard':
      return ['*import*'];
    default:
      return [pathBasename(source)];
  }
}

function globalRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
}

/** Validate match anchor only — quoted import paths are masked as strings. */
function matchAnchorLength(matchText: string): number {
  const quoteIdx = matchText.search(/['"`]/);
  return quoteIdx < 0 ? matchText.length : quoteIdx;
}

function dedupeImports(imports: ParsedImport[]): ParsedImport[] {
  const seen = new Set<string>();
  return imports.filter((imp) => {
    const key = `${imp.source}:${imp.specifiers.join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeSymbols(symbols: ParsedSymbol[]): ParsedSymbol[] {
  const seen = new Set<string>();
  const out: ParsedSymbol[] = [];
  for (const sym of symbols) {
    const key = `${sym.kind}:${sym.name}:${sym.startLine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sym);
  }
  return out;
}

function applyImportRule(content: string, rule: ImportRule, codeMask?: Uint8Array): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const regex = globalRegex(rule.regex);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (codeMask && !isMatchInCode(codeMask, content, match.index, matchAnchorLength(match[0]))) continue;
    let source = match[rule.sourceGroup];
    if (!source) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          source = match[i];
          break;
        }
      }
    }
    if (!source) continue;

    source = source.trim().replace(/^['"]|['"]$/g, '');
    if (!isExternalImportSource(source)) continue;
    if (rule.skipIfStartsWith && source.startsWith(rule.skipIfStartsWith)) continue;
    if (rule.pathSeparator) {
      source = source.replace(/\./g, rule.pathSeparator);
    }

    const specifiersRaw = rule.specifiersGroup ? match[rule.specifiersGroup] : undefined;
    imports.push({
      source,
      specifiers: resolveSpecifiers(source, specifiersRaw, rule.specifiersDefault),
      isTypeOnly: false,
    });
  }

  return imports;
}

function applySymbolRule(
  content: string,
  lines: string[],
  rule: SymbolRule,
  codeMask?: Uint8Array,
): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const regex = globalRegex(rule.regex);
  const nameGroup = rule.nameGroup ?? 1;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (codeMask && !isMatchInCode(codeMask, content, match.index, matchAnchorLength(match[0]))) continue;
    let name = rule.nameFrom ? rule.nameFrom(match) : match[nameGroup];
    if (!name && nameGroup !== 1) name = match[1];
    if (!name) continue;

    name = name.trim();
    if (!isValidSymbolName(name, rule.kind)) continue;

    const lineNum = lineNumberAt(content, match.index);
    const line = lines[lineNum - 1] ?? '';
    const exportPattern = rule.exportHint ?? /export|pub\s|public|open\s|@export/i;

    symbols.push({
      name,
      kind: rule.kind,
      startLine: lineNum,
      endLine: lineNum,
      isExported: exportPattern.test(line),
      isDefaultExport: /export\s+default|default\s+export/i.test(line),
    });
  }

  return symbols;
}

export function extractProfileImports(
  analyzable: string,
  profile: ExtractorProfile,
  codeMask?: Uint8Array,
): ParsedImport[] {
  const imports: ParsedImport[] = [];
  for (const rule of profile.imports) {
    imports.push(...applyImportRule(analyzable, rule, codeMask));
  }
  return dedupeImports(imports);
}

export function extractProfileSymbols(
  analyzable: string,
  lines: string[],
  profile: ExtractorProfile,
  codeMask?: Uint8Array,
): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  for (const rule of profile.symbols) {
    symbols.push(...applySymbolRule(analyzable, lines, rule, codeMask));
  }
  return dedupeSymbols(symbols);
}

export function extractProfileCalls(analyzable: string, profile: ExtractorProfile, codeMask?: Uint8Array): ParsedCall[] {
  const calls: ParsedCall[] = [];

  if (profile.callStyle === 'python') {
    const regex = /(?<![.\w$])(\w+)\s*\(/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(analyzable)) !== null) {
      if (codeMask && !isMatchInCode(codeMask, analyzable, match.index, match[0].length)) continue;
      const callee = match[1]!;
      if (CALL_SKIP.has(callee.toLowerCase())) continue;
      calls.push({ callee, line: lineNumberAt(analyzable, match.index) });
    }
    return dedupeCalls(calls).slice(0, 300);
  }

  const regex = /(?<![.\w$])(?:await\s+)?(\w+(?:\.\w+)*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(analyzable)) !== null) {
    if (codeMask && !isMatchInCode(codeMask, analyzable, match.index, match[0].length)) continue;
    const callee = match[1]!;
    const base = callee.split('.')[0]!;
    if (CALL_SKIP.has(base.toLowerCase())) continue;
    calls.push({ callee, line: lineNumberAt(analyzable, match.index) });
  }

  return dedupeCalls(calls).slice(0, 300);
}

function dedupeCalls(calls: ParsedCall[]): ParsedCall[] {
  const seen = new Set<string>();
  return calls.filter((c) => {
    const key = `${c.callee}:${c.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractProfileExports(
  analyzable: string,
  profile: ExtractorProfile,
  codeMask?: Uint8Array,
): string[] {
  if (!profile.exportPatterns?.length) return [];
  const exports: string[] = [];
  const seen = new Set<string>();

  for (const pattern of profile.exportPatterns) {
    const regex = globalRegex(pattern);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(analyzable)) !== null) {
      if (codeMask && !isMatchInCode(codeMask, analyzable, match.index, match[0].length)) continue;
      if (match[1] && !seen.has(match[1])) {
        seen.add(match[1]);
        exports.push(match[1]);
      }
    }
  }
  return exports;
}
