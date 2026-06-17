import type { ParsedSymbol } from '../types.js';

export interface ImportRule {
  regex: RegExp;
  sourceGroup: number;
  specifiersGroup?: number;
  specifiersDefault?: 'basename' | 'wildcard' | 'last-segment';
  skipIfStartsWith?: string;
  pathSeparator?: '/' | '.';
}

export interface SymbolRule {
  regex: RegExp;
  kind: ParsedSymbol['kind'];
  /** Capture group for symbol name (default 1). */
  nameGroup?: number;
  /** Build composite names e.g. terraform resource "type" "name". */
  nameFrom?: (match: RegExpExecArray) => string | undefined;
  exportHint?: RegExp;
}

export interface ExtractorProfile {
  id: string;
  imports: ImportRule[];
  symbols: SymbolRule[];
  callStyle: 'js' | 'python';
  exportPatterns?: RegExp[];
}

export interface LanguageDefinition {
  id: string;
  label: string;
  extensions: string[];
  basename?: string[];
  profile: string;
}

/** Reusable extraction profiles — shared across language families. */
export const EXTRACTOR_PROFILES: Record<string, ExtractorProfile> = {
  dart: {
    id: 'dart',
    callStyle: 'js',
    imports: [
      { regex: /^import\s+['"]([^'"]+)['"]/gm, sourceGroup: 1, specifiersDefault: 'basename' },
      { regex: /^export\s+['"]([^'"]+)['"]/gm, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /(?:abstract\s+)?class\s+(\w+)/g, kind: 'class' },
      { regex: /mixin\s+(\w+)/g, kind: 'interface' },
      { regex: /enum\s+(\w+)/g, kind: 'type' },
      { regex: /(?:Future<[^>]+>|void|bool|int|double|String|dynamic|\w+)\s+(\w+)\s*\(/g, kind: 'function' },
    ],
    exportPatterns: [/library\s+(\w+)/g],
  },
  lua: {
    id: 'lua',
    callStyle: 'js',
    imports: [
      { regex: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /function\s+(\w+)\s*\(/g, kind: 'function' },
      { regex: /local\s+function\s+(\w+)\s*\(/g, kind: 'function' },
      { regex: /(\w+)\s*=\s*function\s*\(/g, kind: 'function' },
    ],
  },
  r: {
    id: 'r',
    callStyle: 'js',
    imports: [
      { regex: /library\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, sourceGroup: 1, specifiersDefault: 'wildcard' },
      { regex: /require\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /(\w+)\s*<-\s*function\s*\(/g, kind: 'function' },
      { regex: /^(\w+)\s*<-/gm, kind: 'function' },
    ],
  },
  julia: {
    id: 'julia',
    callStyle: 'js',
    imports: [
      { regex: /(?:using|import)\s+([\w.]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /function\s+(\w+)/g, kind: 'function' },
      { regex: /struct\s+(\w+)/g, kind: 'class' },
      { regex: /mutable\s+struct\s+(\w+)/g, kind: 'class' },
      { regex: /module\s+(\w+)/g, kind: 'interface' },
    ],
  },
  elixir: {
    id: 'elixir',
    callStyle: 'js',
    imports: [
      { regex: /(?:use|import|alias|require)\s+([\w.]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /defmodule\s+([\w.]+)/g, kind: 'class' },
      { regex: /def(?:p|macro|guard)?\s+(\w+)/g, kind: 'function' },
    ],
  },
  erlang: {
    id: 'erlang',
    callStyle: 'js',
    imports: [
      { regex: /-include\s*\(\s*['"]([^'"]+)['"]\s*\)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /-module\s*\(\s*(\w+)\s*\)/g, kind: 'interface' },
      { regex: /-record\s*\(\s*(\w+)/g, kind: 'type' },
      { regex: /(\w+)\s*\([^)]*\)\s*->/g, kind: 'function' },
    ],
  },
  haskell: {
    id: 'haskell',
    callStyle: 'js',
    imports: [
      { regex: /^import\s+(?:qualified\s+)?([\w.]+)/gm, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /^(?:data|newtype)\s+(\w+)/gm, kind: 'type' },
      { regex: /^class\s+(\w+)/gm, kind: 'interface' },
      { regex: /^instance\s+(\w+)/gm, kind: 'interface' },
      { regex: /^(\w+)\s*::/gm, kind: 'function' },
    ],
  },
  clojure: {
    id: 'clojure',
    callStyle: 'js',
    imports: [
      { regex: /(?:require|use|import)\s+\[([\w./-]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
      { regex: /:require\s+\[([\w./-]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /defn\s+(\w+)/g, kind: 'function' },
      { regex: /defmacro\s+(\w+)/g, kind: 'function' },
      { regex: /defrecord\s+(\w+)/g, kind: 'class' },
      { regex: /deftype\s+(\w+)/g, kind: 'type' },
    ],
  },
  groovy: {
    id: 'groovy',
    callStyle: 'js',
    imports: [
      { regex: /^import\s+(?:static\s+)?([\w.]+)/gm, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.', skipIfStartsWith: 'java.' },
    ],
    symbols: [
      { regex: /(?:abstract\s+)?class\s+(\w+)/g, kind: 'class' },
      { regex: /interface\s+(\w+)/g, kind: 'interface' },
      { regex: /(?:def|void|boolean|int|long|String)\s+(\w+)\s*\(/g, kind: 'function' },
    ],
  },
  objc: {
    id: 'objc',
    callStyle: 'js',
    imports: [
      { regex: /#import\s+[<"]([^>"]+)[>"]/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /@interface\s+(\w+)/g, kind: 'class' },
      { regex: /@protocol\s+(\w+)/g, kind: 'interface' },
      { regex: /[-+]\s*\([^)]+\)\s*(\w+)/g, kind: 'function' },
    ],
  },
  fsharp: {
    id: 'fsharp',
    callStyle: 'js',
    imports: [
      { regex: /^open\s+([\w.]+)/gm, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /type\s+(\w+)/g, kind: 'type' },
      { regex: /module\s+(\w+)/g, kind: 'interface' },
      { regex: /let\s+(\w+)/g, kind: 'function' },
      { regex: /member\s+\w+\.(\w+)/g, kind: 'function' },
    ],
  },
  vbnet: {
    id: 'vbnet',
    callStyle: 'js',
    imports: [
      { regex: /^Imports\s+([\w.]+)/gim, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /(?:Public|Private|Friend)\s+Class\s+(\w+)/gi, kind: 'class' },
      { regex: /(?:Public|Private|Friend)\s+Interface\s+(\w+)/gi, kind: 'interface' },
      { regex: /(?:Public|Private|Friend)\s+(?:Sub|Function)\s+(\w+)/gi, kind: 'function' },
    ],
  },
  perl: {
    id: 'perl',
    callStyle: 'js',
    imports: [
      { regex: /(?:use|require)\s+([\w:]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '/' },
    ],
    symbols: [
      { regex: /sub\s+(\w+)/g, kind: 'function' },
      { regex: /package\s+(\w+)/g, kind: 'interface' },
    ],
  },
  zig: {
    id: 'zig',
    callStyle: 'js',
    imports: [
      { regex: /@import\s*\(\s*"([^"]+)"/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /fn\s+(\w+)/g, kind: 'function' },
      { regex: /const\s+(\w+)\s*=/g, kind: 'type' },
      { regex: /struct\s+(\w+)/g, kind: 'class' },
    ],
  },
  nim: {
    id: 'nim',
    callStyle: 'js',
    imports: [
      { regex: /import\s+([\w/,]+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /proc\s+(\w+)/g, kind: 'function' },
      { regex: /func\s+(\w+)/g, kind: 'function' },
      { regex: /type\s+(\w+)/g, kind: 'type' },
      { regex: /object\s+(\w+)/g, kind: 'class' },
    ],
  },
  crystal: {
    id: 'crystal',
    callStyle: 'js',
    imports: [
      { regex: /require\s+['"]([^'"]+)['"]/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /class\s+(\w+)/g, kind: 'class' },
      { regex: /module\s+(\w+)/g, kind: 'interface' },
      { regex: /def\s+(\w+)/g, kind: 'function' },
    ],
  },
  ocaml: {
    id: 'ocaml',
    callStyle: 'js',
    imports: [
      { regex: /^open\s+([\w.]+)/gm, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /module\s+(\w+)/g, kind: 'interface' },
      { regex: /type\s+(\w+)/g, kind: 'type' },
      { regex: /let\s+(\w+)/g, kind: 'function' },
      { regex: /class\s+\w+\s+(\w+)/g, kind: 'class' },
    ],
  },
  solidity: {
    id: 'solidity',
    callStyle: 'js',
    imports: [
      { regex: /import\s+(?:[\w.]+\s+from\s+)?['"]([^'"]+)['"]/g, sourceGroup: 1, specifiersDefault: 'basename' },
      { regex: /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, sourceGroup: 2, specifiersGroup: 1, specifiersDefault: 'wildcard' },
    ],
    symbols: [
      { regex: /contract\s+(\w+)(?:\s+is\s+[\w,\s]+)?/g, kind: 'class' },
      { regex: /interface\s+(\w+)/g, kind: 'interface' },
      { regex: /library\s+(\w+)/g, kind: 'interface' },
      { regex: /function\s+(\w+)/g, kind: 'function' },
    ],
  },
  terraform: {
    id: 'terraform',
    callStyle: 'js',
    imports: [
      { regex: /module\s+"([^"]+)"/g, sourceGroup: 1, specifiersDefault: 'wildcard' },
      { regex: /source\s*=\s*"([^"]+)"/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      {
        regex: /resource\s+"([^"]+)"\s+"([^"]+)"/g,
        kind: 'class',
        nameFrom: (m) => `${m[1]}.${m[2]}`,
      },
      {
        regex: /data\s+"([^"]+)"\s+"([^"]+)"/g,
        kind: 'type',
        nameFrom: (m) => `${m[1]}.${m[2]}`,
      },
      { regex: /variable\s+"([^"]+)"/g, kind: 'type' },
      { regex: /output\s+"([^"]+)"/g, kind: 'function' },
    ],
  },
  dockerfile: {
    id: 'dockerfile',
    callStyle: 'js',
    imports: [
      { regex: /^FROM\s+(\S+)/gim, sourceGroup: 1, specifiersDefault: 'basename' },
      { regex: /^COPY\s+--from=(\S+)/gim, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /^FROM\s+\S+\s+AS\s+(\w+)/gim, kind: 'type' },
    ],
  },
  shell: {
    id: 'shell',
    callStyle: 'js',
    imports: [
      { regex: /(?:source|\.\s+)\s*['"]?([^'"\s;]+)['"]?/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /^(\w+)\s*\(\s*\)\s*\{/gm, kind: 'function' },
      { regex: /^function\s+(\w+)/gm, kind: 'function' },
    ],
  },
  powershell: {
    id: 'powershell',
    callStyle: 'js',
    imports: [
      { regex: /Import-Module\s+([^\s#]+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
      { regex: /(?:Using\s+Module|#Requires\s+-Module)\s+([^\s#]+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /function\s+(\w+)/gi, kind: 'function' },
      { regex: /class\s+(\w+)/g, kind: 'class' },
    ],
  },
  sql: {
    id: 'sql',
    callStyle: 'js',
    imports: [],
    symbols: [
      { regex: /CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+(\w+)/gi, kind: 'function' },
      { regex: /CREATE\s+TABLE\s+(\w+)/gi, kind: 'class' },
      { regex: /CREATE\s+VIEW\s+(\w+)/gi, kind: 'interface' },
    ],
  },
  fortran: {
    id: 'fortran',
    callStyle: 'js',
    imports: [
      { regex: /USE\s+([\w_]+)/gi, sourceGroup: 1, specifiersDefault: 'wildcard' },
    ],
    symbols: [
      { regex: /(?:PROGRAM|SUBROUTINE|FUNCTION)\s+(\w+)/gi, kind: 'function' },
      { regex: /MODULE\s+(\w+)/gi, kind: 'interface' },
    ],
  },
  ada: {
    id: 'ada',
    callStyle: 'js',
    imports: [
      { regex: /with\s+([\w.]+)/gi, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /package\s+(\w+)/gi, kind: 'interface' },
      { regex: /procedure\s+(\w+)/gi, kind: 'function' },
      { regex: /function\s+(\w+)/gi, kind: 'function' },
    ],
  },
  assembly: {
    id: 'assembly',
    callStyle: 'js',
    imports: [
      { regex: /\.include\s+['"]?([^'"\s]+)/gi, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /^(\w+):/gm, kind: 'function' },
    ],
  },
  vhdl: {
    id: 'vhdl',
    callStyle: 'js',
    imports: [
      { regex: /(?:library|use)\s+([\w.]+)/gi, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /entity\s+(\w+)/gi, kind: 'class' },
      { regex: /architecture\s+(\w+)/gi, kind: 'interface' },
      { regex: /procedure\s+(\w+)/gi, kind: 'function' },
    ],
  },
  verilog: {
    id: 'verilog',
    callStyle: 'js',
    imports: [
      { regex: /`include\s+"([^"]+)"/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /module\s+(\w+)/g, kind: 'class' },
      { regex: /function\s+\w+\s+(\w+)/g, kind: 'function' },
    ],
  },
  cmake: {
    id: 'cmake',
    callStyle: 'js',
    imports: [
      { regex: /include\s*\(\s*([^)]+)\s*\)/gi, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /add_executable\s*\(\s*(\w+)/gi, kind: 'function' },
      { regex: /add_library\s*\(\s*(\w+)/gi, kind: 'class' },
      { regex: /function\s*\(\s*(\w+)/gi, kind: 'function' },
    ],
  },
  makefile: {
    id: 'makefile',
    callStyle: 'js',
    imports: [
      { regex: /-include\s+(\S+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
      { regex: /include\s+(\S+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /^([\w.-]+)\s*:/gm, kind: 'function' },
    ],
  },
  racket: {
    id: 'racket',
    callStyle: 'js',
    imports: [
      { regex: /#lang\s+([\w/]+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
      { regex: /require\s+\[\s*[\w/]+\s+([\w./-]+)/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /define\s+\(\s*(\w+)/g, kind: 'function' },
      { regex: /struct\s+(\w+)/g, kind: 'class' },
    ],
  },
  gleam: {
    id: 'gleam',
    callStyle: 'js',
    imports: [
      { regex: /import\s+([\w/]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '/' },
    ],
    symbols: [
      { regex: /pub\s+fn\s+(\w+)/g, kind: 'function' },
      { regex: /pub\s+type\s+(\w+)/g, kind: 'type' },
    ],
  },
  odin: {
    id: 'odin',
    callStyle: 'js',
    imports: [
      { regex: /import\s+"([^"]+)"/g, sourceGroup: 1, specifiersDefault: 'basename' },
    ],
    symbols: [
      { regex: /(\w+)\s*::\s*proc\s*\(/g, kind: 'function' },
      { regex: /(\w+)\s*::\s*struct/g, kind: 'class' },
    ],
  },
  dlang: {
    id: 'dlang',
    callStyle: 'js',
    imports: [
      { regex: /import\s+([\w.]+)/g, sourceGroup: 1, specifiersDefault: 'last-segment', pathSeparator: '.' },
    ],
    symbols: [
      { regex: /class\s+(\w+)/g, kind: 'class' },
      { regex: /interface\s+(\w+)/g, kind: 'interface' },
      { regex: /(?:void|\w+)\s+(\w+)\s*\(/g, kind: 'function' },
    ],
  },
  pascal: {
    id: 'pascal',
    callStyle: 'js',
    imports: [
      { regex: /uses\s+([\w,\s.]+)/gi, sourceGroup: 1, specifiersDefault: 'wildcard' },
    ],
    symbols: [
      { regex: /(?:procedure|function)\s+(\w+)/gi, kind: 'function' },
      { regex: /(?:type|class)\s+(\w+)/gi, kind: 'class' },
    ],
  },
  prolog: {
    id: 'prolog',
    callStyle: 'js',
    imports: [],
    symbols: [
      { regex: /^(\w+)\s*\([^)]*\)\s*:-/gm, kind: 'function' },
    ],
  },
  vue: {
    id: 'vue',
    callStyle: 'js',
    imports: [
      { regex: /import\s+(?:[\w*{}\s,$]+)\s+from\s+['"]([^'"]+)['"]/g, sourceGroup: 1, specifiersDefault: 'wildcard' },
    ],
    symbols: [
      { regex: /export\s+default\s+\{\s*name:\s*['"](\w+)['"]/g, kind: 'class' },
      { regex: /function\s+(\w+)/g, kind: 'function' },
      { regex: /const\s+(\w+)\s*=\s*\(/g, kind: 'function' },
    ],
  },
  svelte: {
    id: 'svelte',
    callStyle: 'js',
    imports: [
      { regex: /import\s+(?:[\w*{}\s,$]+)\s+from\s+['"]([^'"]+)['"]/g, sourceGroup: 1, specifiersDefault: 'wildcard' },
    ],
    symbols: [
      { regex: /function\s+(\w+)/g, kind: 'function' },
      { regex: /export\s+(?:const|let|function)\s+(\w+)/g, kind: 'function' },
    ],
  },
};

/** 50 programming languages — from Python & JS through systems, ML, infra, and HDL. */
export const LANGUAGE_DEFINITIONS: LanguageDefinition[] = [
  { id: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx', '.mts', '.cts'], profile: 'javascript' },
  { id: 'javascript', label: 'JavaScript', extensions: ['.js', '.jsx', '.mjs', '.cjs'], profile: 'javascript' },
  { id: 'python', label: 'Python', extensions: ['.py', '.pyw', '.pyi'], profile: 'python' },
  { id: 'go', label: 'Go', extensions: ['.go'], profile: 'go' },
  { id: 'rust', label: 'Rust', extensions: ['.rs'], profile: 'rust' },
  { id: 'java', label: 'Java', extensions: ['.java'], profile: 'java' },
  { id: 'csharp', label: 'C#', extensions: ['.cs'], profile: 'csharp' },
  { id: 'php', label: 'PHP', extensions: ['.php'], profile: 'php' },
  { id: 'ruby', label: 'Ruby', extensions: ['.rb', '.rake', '.erb'], profile: 'ruby' },
  { id: 'kotlin', label: 'Kotlin', extensions: ['.kt', '.kts'], profile: 'kotlin' },
  { id: 'scala', label: 'Scala', extensions: ['.scala', '.sc'], profile: 'scala' },
  { id: 'swift', label: 'Swift', extensions: ['.swift'], profile: 'swift' },
  { id: 'c', label: 'C', extensions: ['.c', '.h'], profile: 'c' },
  { id: 'cpp', label: 'C++', extensions: ['.cpp', '.hpp', '.cc', '.hh', '.cxx', '.hxx'], profile: 'cpp' },
  { id: 'dart', label: 'Dart', extensions: ['.dart'], profile: 'dart' },
  { id: 'lua', label: 'Lua', extensions: ['.lua'], profile: 'lua' },
  { id: 'r', label: 'R', extensions: ['.r', '.R'], profile: 'r' },
  { id: 'julia', label: 'Julia', extensions: ['.jl'], profile: 'julia' },
  { id: 'elixir', label: 'Elixir', extensions: ['.ex', '.exs'], profile: 'elixir' },
  { id: 'erlang', label: 'Erlang', extensions: ['.erl', '.hrl'], profile: 'erlang' },
  { id: 'haskell', label: 'Haskell', extensions: ['.hs', '.lhs'], profile: 'haskell' },
  { id: 'clojure', label: 'Clojure', extensions: ['.clj', '.cljs', '.cljc'], profile: 'clojure' },
  { id: 'groovy', label: 'Groovy', extensions: ['.groovy', '.gradle'], profile: 'groovy' },
  { id: 'objective-c', label: 'Objective-C', extensions: ['.m', '.mm'], profile: 'objc' },
  { id: 'fsharp', label: 'F#', extensions: ['.fs', '.fsi', '.fsx'], profile: 'fsharp' },
  { id: 'vbnet', label: 'Visual Basic .NET', extensions: ['.vb'], profile: 'vbnet' },
  { id: 'perl', label: 'Perl', extensions: ['.pl', '.pm'], profile: 'perl' },
  { id: 'zig', label: 'Zig', extensions: ['.zig'], profile: 'zig' },
  { id: 'nim', label: 'Nim', extensions: ['.nim'], profile: 'nim' },
  { id: 'crystal', label: 'Crystal', extensions: ['.cr'], profile: 'crystal' },
  { id: 'ocaml', label: 'OCaml', extensions: ['.ml', '.mli'], profile: 'ocaml' },
  { id: 'solidity', label: 'Solidity', extensions: ['.sol'], profile: 'solidity' },
  { id: 'terraform', label: 'Terraform', extensions: ['.tf', '.tfvars', '.hcl'], profile: 'terraform' },
  { id: 'dockerfile', label: 'Dockerfile', extensions: ['.dockerfile'], basename: ['dockerfile'], profile: 'dockerfile' },
  { id: 'shell', label: 'Shell', extensions: ['.sh', '.bash', '.zsh'], profile: 'shell' },
  { id: 'powershell', label: 'PowerShell', extensions: ['.ps1', '.psm1', '.psd1'], profile: 'powershell' },
  { id: 'sql', label: 'SQL', extensions: ['.sql'], profile: 'sql' },
  { id: 'vue', label: 'Vue', extensions: ['.vue'], profile: 'vue' },
  { id: 'svelte', label: 'Svelte', extensions: ['.svelte'], profile: 'svelte' },
  { id: 'fortran', label: 'Fortran', extensions: ['.f', '.f90', '.f95', '.for'], profile: 'fortran' },
  { id: 'ada', label: 'Ada', extensions: ['.adb', '.ads'], profile: 'ada' },
  { id: 'assembly', label: 'Assembly', extensions: ['.asm', '.s', '.S'], profile: 'assembly' },
  { id: 'vhdl', label: 'VHDL', extensions: ['.vhdl', '.vhd'], profile: 'vhdl' },
  { id: 'verilog', label: 'Verilog', extensions: ['.v', '.sv'], profile: 'verilog' },
  { id: 'cmake', label: 'CMake', extensions: ['.cmake'], basename: ['cmakelists.txt'], profile: 'cmake' },
  { id: 'makefile', label: 'Makefile', extensions: ['.mk'], basename: ['makefile', 'gnumakefile'], profile: 'makefile' },
  { id: 'racket', label: 'Racket', extensions: ['.rkt'], profile: 'racket' },
  { id: 'gleam', label: 'Gleam', extensions: ['.gleam'], profile: 'gleam' },
  { id: 'odin', label: 'Odin', extensions: ['.odin'], profile: 'odin' },
  { id: 'dlang', label: 'D', extensions: ['.d'], profile: 'dlang' },
  { id: 'pascal', label: 'Pascal', extensions: ['.pas', '.pp'], profile: 'pascal' },
  { id: 'prolog', label: 'Prolog', extensions: ['.pro'], profile: 'prolog' },
];

/** Legacy profiles reuse dedicated parser extractors — listed here for completeness. */
export const LEGACY_PROFILE_LANGUAGES = new Set([
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'java',
  'csharp',
  'php',
  'ruby',
  'kotlin',
  'scala',
  'swift',
  'c',
  'cpp',
]);

export const SUPPORTED_LANGUAGE_COUNT = LANGUAGE_DEFINITIONS.length;
