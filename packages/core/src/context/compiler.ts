import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MemoryModel } from '../types.js';
import type { MnemosGraph } from '../graph/graph.js';
import { toSerializable } from '../graph/graph.js';
import { buildArchitectureLanguageSection, buildRepositoryLanguagesMarkdown } from '../languages/docs.js';
import {
  buildGraphsIndexMarkdown,
  buildDomainSectionGraph,
  buildFlowsSectionGraphs,
  buildDependenciesSectionGraphs,
  buildCriticalPathsSectionGraph,
  buildArchitectureOverviewGraphs,
  buildRepositorySummaryGraphs,
  buildSmellsSectionGraph,
} from './graph-markdown.js';
import { buildLanguagePipelineMermaid } from '../languages/docs.js';
import { compactMarkdown } from '../util/compact-json.js';

export async function compileContext(
  memory: MemoryModel,
  graph: MnemosGraph,
  outputDir: string,
): Promise<string> {
  const contextDir = path.join(outputDir, 'context');
  await mkdir(contextDir, { recursive: true });

  const files: Record<string, string> = {
    'README.md': compileContextReadme(memory),
    'repository_summary.md': compileRepositorySummary(memory),
    'architecture.md': compileArchitecture(memory),
    'languages.md': buildRepositoryLanguagesMarkdown(memory),
    'graphs.md': buildGraphsIndexMarkdown(memory),
    'domains.md': compileDomains(memory),
    'flows.md': compileFlows(memory),
    'critical_paths.md': compileCriticalPaths(memory),
    'services.md': compileServices(memory),
    'apis.md': compileApis(memory),
    'dependencies.md': compileDependencies(memory),
    'smells.md': compileSmells(memory),
  };

  for (const [filename, content] of Object.entries(files)) {
    await writeFile(path.join(contextDir, filename), compactMarkdown(content), 'utf-8');
  }

  // Also write graph snapshot for UI
  const graphData = toSerializable(graph);
  await writeFile(
    path.join(outputDir, 'graph.json'),
    JSON.stringify(graphData, null, 2),
    'utf-8',
  );

  return contextDir;
}

function compileContextReadme(memory: MemoryModel): string {
  const { architecture } = memory;
  return `# Mnemos Context — ${architecture.name}

> Generated at \`${memory.builtAt}\` · Mermaid diagrams render in GitHub, Cursor, and VS Code

## Start here

| Priority | File | Why |
|----------|------|-----|
| 1 | [repository_summary.md](./repository_summary.md) | Stats, layers, language pie |
| 2 | [graphs.md](./graphs.md) | **All architecture diagrams** |
| 3 | [languages.md](./languages.md) | Stack breakdown + parsing pipeline |
| 4 | [architecture.md](./architecture.md) | Services, layers, capabilities |

## Full index

| File | Graphs |
|------|--------|
| [graphs.md](./graphs.md) | Domain · flow · service · dependency · risk · language · pipeline |
| [languages.md](./languages.md) | Pie chart · language flow · extractor routing · families |
| [architecture.md](./architecture.md) | Layers · domains · capabilities · language section |
| [domains.md](./domains.md) | Domain interaction graph |
| [flows.md](./flows.md) | Flow overview + step diagrams |
| [dependencies.md](./dependencies.md) | Top edges + service graph |
| [critical_paths.md](./critical_paths.md) | High-risk path diagram |
| [smells.md](./smells.md) | Smell severity pie |
| [services.md](./services.md) | Service catalog |
| [apis.md](./apis.md) | Route/API table |

## Build pipeline

${buildLanguagePipelineMermaid()}

Re-run \`mnemos build\` after structural changes to refresh every chart.
`;
}

function compileRepositorySummary(memory: MemoryModel): string {
  const { stats, architecture } = memory;
  return `# ${architecture.name} — Repository Summary

> Built by Mnemos at ${memory.builtAt}

## Overview

${architecture.summary}

## Stats

| Metric | Value |
|--------|-------|
| Files scanned | ${stats.filesScanned.toLocaleString()} |
| Graph nodes | ${stats.nodesCreated.toLocaleString()} |
| Graph edges | ${stats.edgesCreated.toLocaleString()} |
| Domains discovered | ${stats.domainsFound} |
| Flows detected | ${stats.flowsFound} |
| Build time | ${(stats.durationMs / 1000).toFixed(1)}s |

## Architecture Type

**${architecture.type}** with layers: ${architecture.layers.join(', ')}

## Languages

${Object.entries(architecture.languages)
  .sort((a, b) => b[1] - a[1])
  .map(([lang, count]) => `- **${lang}**: ${count} files`)
  .join('\n')}

See **[languages.md](./languages.md)** for distribution charts and the Mnemos parsing pipeline.

## Packages

${architecture.packages.map((p) => `- \`${p}\``).join('\n')}

## Quick Navigation

- ${memory.domains.length} logical domains
- ${memory.flows.length} execution flows
- ${memory.apis.length} API/route endpoints
- ${memory.services.length} services
- ${memory.smells.length} architecture smells detected

${buildRepositorySummaryGraphs(memory)}
`;
}

function compileArchitecture(memory: MemoryModel): string {
  const { architecture, services } = memory;
  return `# Architecture — ${architecture.name}

## System Type

${architecture.type}

## Layers

${architecture.layers.map((l, i) => `${i + 1}. **${l}**`).join('\n')}

## Services

${services
  .slice(0, 30)
  .map(
    (s) =>
      `### ${s.name}
- **Domain**: ${s.domain ?? 'Unassigned'}
- **Path**: \`${s.path}\`
- **Dependencies**: ${s.dependencies.join(', ') || 'none'}
- **Dependents**: ${s.dependents.join(', ') || 'none'}
- **Key exports**: ${s.exports.slice(0, 5).join(', ') || 'none'}`,
  )
  .join('\n\n')}

${buildArchitectureOverviewGraphs(memory)}

${buildArchitectureLanguageSection(memory)}
`;
}

function compileDomains(memory: MemoryModel): string {
  return `# Domains

${memory.domains.length} logical domains discovered through path analysis and import-graph clustering.

${buildDomainSectionGraph(memory)}

${memory.domains
  .map(
    (d) => `## ${d.name}

- **Confidence**: ${(d.confidence * 100).toFixed(0)}%
- **Files/nodes**: ${d.nodes.length}
- **Description**: ${d.description}
- **Entry points**: ${d.entryPoints.length}

${d.entryPoints.length > 0 ? d.entryPoints.slice(0, 5).map((e) => `- \`${e}\``).join('\n') : '_No entry points detected_'}
`,
  )
  .join('\n')}
`;
}

function compileFlows(memory: MemoryModel): string {
  const byType = groupBy(memory.flows, (f) => f.type);

  let content = `# Execution Flows

${memory.flows.length} flows detected across the codebase.

${buildFlowsSectionGraphs(memory)}

`;

  for (const [type, flows] of Object.entries(byType)) {
    content += `## ${formatFlowType(type)}\n\n`;
    for (const flow of flows.slice(0, 15)) {
      content += `### ${flow.name}

- **Type**: ${flow.type}
- **Confidence**: ${(flow.confidence * 100).toFixed(0)}%
- **Entry**: \`${flow.entryPoint}\`
- **Steps**: ${flow.steps.length}

\`\`\`
${flow.steps.map((s, i) => `${i + 1}. [${s.kind}] ${s.name}${s.path ? ` (${s.path})` : ''}`).join('\n')}
\`\`\`

${flow.description}

`;
    }
  }

  return content;
}

function compileCriticalPaths(memory: MemoryModel): string {
  return `# Critical Paths

High-risk paths where changes have wide blast radius.

${buildCriticalPathsSectionGraph(memory)}

${memory.criticalPaths
  .map(
    (cp) => `## ${cp.name}

- **Risk**: ${cp.risk.toUpperCase()}
- **Nodes involved**: ${cp.nodes.length}
- **Description**: ${cp.description}
`,
  )
  .join('\n')}
`;
}

function compileServices(memory: MemoryModel): string {
  return `# Services

${memory.services
  .map(
    (s) => `## ${s.name}

| Property | Value |
|----------|-------|
| Domain | ${s.domain ?? '—'} |
| Path | \`${s.path}\` |
| Dependencies | ${s.dependencies.length} |
| Dependents | ${s.dependents.length} |
`,
  )
  .join('\n')}
`;
}

function compileApis(memory: MemoryModel): string {
  return `# API Endpoints

${memory.apis.length} routes and API endpoints detected.

| Method | Path | Handler | Domain |
|--------|------|---------|--------|
${memory.apis
  .slice(0, 100)
  .map((a) => `| ${a.method} | \`${a.path}\` | \`${a.handler}\` | ${a.domain ?? '—'} |`)
  .join('\n')}
`;
}

function compileDependencies(memory: MemoryModel): string {
  const topDeps = getTopDependencies(memory.dependencies, 30);
  return `# Key Dependencies

Top dependency relationships by frequency.

${buildDependenciesSectionGraphs(memory)}

${topDeps
  .map(([pair, count]) => `- **${pair}**: ${count} references`)
  .join('\n')}
`;
}

function compileSmells(memory: MemoryModel): string {
  return `# Architecture Smells

${memory.smells.length} potential issues detected.

${buildSmellsSectionGraph(memory)}

${memory.smells
  .map(
    (s) => `## [${s.severity.toUpperCase()}] ${formatSmellType(s.type)}

${s.description}

**Recommendation**: ${s.recommendation}
`,
  )
  .join('\n')}
`;
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

function formatFlowType(type: string): string {
  return {
    request: 'Request Flows',
    event: 'Event Flows',
    dependency: 'Dependency Flows',
    user_journey: 'User Journey Flows',
  }[type] ?? type;
}

function formatSmellType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTopDependencies(deps: MemoryModel['dependencies'], limit: number): [string, number][] {
  const counts = new Map<string, number>();
  for (const d of deps) {
    const key = `${d.from} → ${d.to}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export async function writeMemoryModel(memory: MemoryModel, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  const files: Record<string, unknown> = {
    'architecture.json': memory.architecture,
    'domains.json': memory.domains,
    'flows.json': memory.flows,
    'services.json': memory.services,
    'apis.json': memory.apis,
    'dependencies.json': memory.dependencies,
    'critical_paths.json': memory.criticalPaths,
    'dead_code.json': memory.deadCode,
    'smells.json': memory.smells,
    'stats.json': memory.stats,
    'memory.json': memory,
  };

  for (const [filename, data] of Object.entries(files)) {
    await writeFile(path.join(outputDir, filename), JSON.stringify(data, null, 2), 'utf-8');
  }
}
