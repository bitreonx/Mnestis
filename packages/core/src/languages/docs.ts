import type { MemoryModel } from '../types.js';
import { LANGUAGE_DEFINITIONS, SUPPORTED_LANGUAGE_COUNT } from './registry.js';

/** Mermaid: end-to-end parsing pipeline (static reference). */
export function buildLanguagePipelineMermaid(): string {
  return `\`\`\`mermaid
flowchart TB
  subgraph scan [Scan]
    F[Source files] --> G[Glob + basename rules]
    G --> L[inferLanguage]
  end

  subgraph lex [Lexical analysis]
    L --> SFC[Vue/Svelte script isolation]
    SFC --> MASK[Code mask builder]
    MASK --> TEXT[Structure text]
    MASK --> SAFE[callSafe text]
    MASK --> CM[codeMask bitmap]
  end

  subgraph extract [Extraction]
    TEXT --> IMP[Imports]
    TEXT --> SYM[Symbols]
    TEXT --> EXP[Exports]
    SAFE --> CALL[Call sites]
    CM -. validates .-> IMP
    CM -. validates .-> SYM
    CM -. validates .-> CALL
  end

  subgraph legacy [Dedicated extractors]
    IMP --> LEG14[14 legacy languages]
    SYM --> LEG14
  end

  subgraph profile [Profile extractors]
    IMP --> PROF[36+ profile languages]
    SYM --> PROF
  end

  subgraph graph [Memory graph]
    IMP --> KG[Knowledge graph]
    SYM --> KG
    CALL --> KG
    EXP --> KG
  end
\`\`\``;
}

/** Mermaid: extractor routing decision. */
export function buildExtractorRoutingMermaid(): string {
  return `\`\`\`mermaid
flowchart TD
  START[Parsed file] --> Q{Legacy language?}
  Q -->|typescript javascript python go rust java csharp php ruby kotlin scala swift c cpp| DED[Dedicated regex extractors]
  Q -->|dart elixir terraform solidity vue ...| PROF[Profile-based extractors]
  DED --> MASK[isMatchInCode filter]
  PROF --> MASK
  MASK --> OUT[ParsedImport ParsedSymbol ParsedCall]
\`\`\``;
}

/** Mermaid: language families covered by Mnemos. */
export function buildLanguageFamiliesMermaid(): string {
  return `\`\`\`mermaid
mindmap
  root((Mnemos ${SUPPORTED_LANGUAGE_COUNT} languages))
    Web and mobile
      TypeScript
      JavaScript
      Vue
      Svelte
      Dart
      PHP
    Systems
      C
      C++
      Rust
      Go
      Zig
      Nim
      Odin
      D
    JVM and .NET
      Java
      Kotlin
      Scala
      Groovy
      C#
      F#
      Visual Basic
    BEAM and FP
      Elixir
      Erlang
      Haskell
      OCaml
      Clojure
      Gleam
      Racket
    Scripting and data
      Python
      Ruby
      Perl
      Lua
      R
      Julia
      Crystal
    Infra and ops
      Terraform
      Dockerfile
      Shell
      PowerShell
      CMake
      Makefile
      SQL
    Hardware
      VHDL
      Verilog
      Assembly
    Other
      Swift
      Objective-C
      Solidity
      Fortran
      Ada
      Prolog
      Pascal
\`\`\``;
}

/** Mermaid pie chart for languages detected in a repository. */
export function buildRepositoryLanguagePieMermaid(languages: Record<string, number>): string {
  const entries = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  if (entries.length === 0) {
    return '_No language statistics available — run `mnemos build`._';
  }

  const lines = ['```mermaid', 'pie showData title Files by language'];
  for (const [lang, count] of entries) {
    const label = lang.replace(/"/g, "'");
    lines.push(`    "${label}" : ${count}`);
  }
  lines.push('```');
  return lines.join('\n');
}

/** Mermaid: how this repo's languages connect to graph nodes. */
export function buildRepositoryLanguageFlowMermaid(languages: Record<string, number>): string {
  const top = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (top.length === 0) return '';

  const nodes = top.map(([lang], i) => `  L${i}["${lang}"]`);
  const edges = top.map((_, i) => (i < top.length - 1 ? `  L${i} --> L${i + 1}` : '')).filter(Boolean);

  return `\`\`\`mermaid
flowchart LR
${nodes.join('\n')}
  subgraph graph [Mnemos graph]
${top.map(([lang], i) => `    L${i} --> N${i}[files · imports · symbols]`).join('\n')}
  end
\`\`\``;
}

function groupLanguagesByCategory(): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    'Web & mobile': ['typescript', 'javascript', 'vue', 'svelte', 'dart', 'php'],
    'Systems': ['c', 'cpp', 'rust', 'go', 'zig', 'nim', 'odin', 'dlang', 'assembly'],
    'JVM & .NET': ['java', 'kotlin', 'scala', 'groovy', 'csharp', 'fsharp', 'vbnet'],
    'BEAM & functional': ['elixir', 'erlang', 'haskell', 'ocaml', 'clojure', 'gleam', 'racket'],
    'Scripting & data': ['python', 'ruby', 'perl', 'lua', 'r', 'julia', 'crystal'],
    'Infra & ops': ['terraform', 'dockerfile', 'shell', 'powershell', 'cmake', 'makefile', 'sql'],
    'Apple': ['swift', 'objective-c'],
    'Web3': ['solidity'],
    'Hardware description': ['vhdl', 'verilog'],
    'Scientific & legacy': ['fortran', 'ada', 'pascal', 'prolog'],
  };

  const labelById = new Map(LANGUAGE_DEFINITIONS.map((d) => [d.id, d.label]));
  const result: Record<string, string[]> = {};

  for (const [category, ids] of Object.entries(groups)) {
    result[category] = ids.map((id) => labelById.get(id) ?? id).sort();
  }

  return result;
}

/** Static reference doc for the Mnemos repo (docs/LANGUAGES.md). */
export function buildLanguagesReferenceMarkdown(): string {
  const categories = groupLanguagesByCategory();
  const categoryTable = Object.entries(categories)
    .map(([cat, langs]) => `| **${cat}** | ${langs.join(', ')} |`)
    .join('\n');

  return `# Mnemos Language Support

Mnemos analyzes **${SUPPORTED_LANGUAGE_COUNT} programming languages** with a production-grade lexical pipeline — not extension counting alone. Every supported language flows through comment/string-aware extraction before imports, symbols, and call edges reach the knowledge graph.

## Why this matters

| Capability | Toy parser | Mnemos |
|------------|------------|--------|
| Comment-safe imports | Often false positives | \`codeMask\` rejects matches inside comments |
| String-safe imports | Matches \`import\` inside strings | Lexical mask + validation |
| Vue / Svelte | Template noise pollutes graph | \`<script>\` isolation only |
| Polyglot repos | Miss files or mis-label | ${SUPPORTED_LANGUAGE_COUNT} languages + Dockerfile/Makefile/CMake |
| Graph quality | Regex on raw text | Dedicated extractors + profile families + dedupe |

## Parsing pipeline

${buildLanguagePipelineMermaid()}

## Extractor routing

${buildExtractorRoutingMermaid()}

## Language families

${buildLanguageFamiliesMermaid()}

## Full language list

| Category | Languages |
|----------|-----------|
${categoryTable}

## Implementation map

| Module | Role |
|--------|------|
| \`packages/core/src/languages/registry.ts\` | 50 language definitions + extractor profiles |
| \`packages/core/src/languages/index.ts\` | Extension/basename inference, public API |
| \`packages/core/src/parser/source-mask.ts\` | Lexical code mask, Vue/Svelte script isolation |
| \`packages/core/src/parser/profile-extractors.ts\` | Profile imports/symbols/calls with validation |
| \`packages/core/src/parser/index.ts\` | Legacy + profile dispatch into graph builder |
| \`packages/core/src/scanner/index.ts\` | Multi-language file discovery |

## Adding a language

1. Add a \`LanguageDefinition\` entry in \`registry.ts\`
2. Add or reuse an \`ExtractorProfile\` with import/symbol rules
3. Add inference tests in \`languages/languages.test.ts\`
4. Run \`npm test\` in \`packages/core\`

See [CONTRIBUTING.md](../CONTRIBUTING.md#language-and-parser-changes).

## API

\`\`\`typescript
import {
  SUPPORTED_LANGUAGE_COUNT,
  SUPPORTED_LANGUAGES,
  inferLanguage,
  getLanguageDefinition,
} from '@mnemos/core';
\`\`\`
`;
}

/** Per-repository \`.mnemos/context/languages.md\` generated at build time. */
export function buildRepositoryLanguagesMarkdown(memory: MemoryModel): string {
  const { architecture } = memory;
  const langs = architecture.languages ?? {};
  const total = Object.values(langs).reduce((s, n) => s + n, 0);
  const detected = Object.keys(langs).length;
  const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]);

  const table =
    sorted.length > 0
      ? sorted
          .map(([lang, count]) => {
            const pct = total ? ((count / total) * 100).toFixed(1) : '0';
            return `| ${lang} | ${count.toLocaleString()} | ${pct}% |`;
          })
          .join('\n')
      : '| _none detected_ | — | — |';

  const notInRepo = LANGUAGE_DEFINITIONS.filter((d) => !langs[d.id] && !langs[d.label.toLowerCase()])
    .slice(0, 8)
    .map((d) => d.label);

  return `# Languages — ${architecture.name}

> Generated by Mnemos · ${SUPPORTED_LANGUAGE_COUNT} languages supported engine-wide

## This repository

| Metric | Value |
|--------|-------|
| Languages detected | **${detected}** |
| Source files analyzed | **${total.toLocaleString()}** |
| Mnemos engine coverage | **${SUPPORTED_LANGUAGE_COUNT}** languages |

## File distribution

${buildRepositoryLanguagePieMermaid(langs)}

## Language breakdown

| Language | Files | Share |
|----------|------:|------:|
${table}

## How files become graph nodes

${buildRepositoryLanguageFlowMermaid(langs)}

## Mnemos parsing pipeline (all languages)

${buildLanguagePipelineMermaid()}

## Extractor routing

${buildExtractorRoutingMermaid()}

## Language families (engine coverage)

${buildLanguageFamiliesMermaid()}

${
  notInRepo.length > 0
    ? `## Supported but not present in this repo

Mnemos can also analyze: ${notInRepo.join(', ')}, and ${SUPPORTED_LANGUAGE_COUNT - 8}+ more.

Full list: [docs/LANGUAGES.md](https://github.com/mnemos/mnemos/blob/main/docs/LANGUAGES.md) or \`SUPPORTED_LANGUAGES\` in \`@mnemos/core\`.
`
    : ''
}

## For AI agents

- Prefer language stats here over guessing stack from folder names
- Cross-reference \`architecture.md\` for services and \`dependencies.md\` for cross-language edges
- Re-run \`mnemos build\` after adding files in a new language
`;
}

/** Short blurb + pipeline graph for architecture.md injection. */
export function buildArchitectureLanguageSection(memory: MemoryModel): string {
  const langs = Object.entries(memory.architecture.languages ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([l, n]) => `${l} (${n})`)
    .join(', ');

  return `## Languages & parsing

**Detected in this repo:** ${langs || 'none yet'}

Mnemos uses a lexical code-mask pipeline (${SUPPORTED_LANGUAGE_COUNT} languages engine-wide). Imports and symbols are extracted only from real code regions — not comments, strings, or Vue templates.

${buildRepositoryLanguagePieMermaid(memory.architecture.languages ?? {})}

${buildExtractorRoutingMermaid()}

${buildLanguagePipelineMermaid()}
`;
}

export function buildLanguageSummaryLine(): string {
  const labels = LANGUAGE_DEFINITIONS.map((d) => d.label);
  return `${SUPPORTED_LANGUAGE_COUNT} languages (${labels.slice(0, 6).join(', ')}, …)`;
}
