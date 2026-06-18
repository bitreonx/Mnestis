import type { MemoryModel } from '../types.js';
import type { MnemosGraph } from '../graph/graph.js';
import { bfsPaths, reverseBfsPaths, getNeighbors } from '../graph/graph.js';
import { resolveNodeQuery } from '../graph/builder.js';
import { searchMemory, buildSearchIndex, type MemorySearchIndex } from '../search/index.js';
import { analyzeImpact } from '../analysis/impact.js';
import { optimizeContextWindow } from '../routing/optimize-context.js';

export interface SubgraphNode {
  id: string;
  name: string;
  kind: string;
  path?: string;
}

export interface SubgraphEdge {
  from: string;
  to: string;
  kind: string;
}

export interface SubgraphContext {
  task: string;
  anchor?: string;
  tokenBudget: number;
  estimatedTokens: number;
  nodes: SubgraphNode[];
  edges: SubgraphEdge[];
  domains: string[];
  flows: string[];
  capabilities: string[];
  apis: string[];
  smells: string[];
  criticalPaths: string[];
  markdown: string;
  json: Record<string, unknown>;
}

const CHARS_PER_TOKEN = 4;

export function compileSubgraphContext(
  memory: MemoryModel,
  task: string,
  graph?: MnemosGraph,
  options: {
    maxHops?: number;
    tokenBudget?: number;
    searchIndex?: MemorySearchIndex;
  } = {},
): SubgraphContext {
  const maxHops = options.maxHops ?? 3;
  const tokenBudget = options.tokenBudget ?? 8000;
  const index = options.searchIndex ?? buildSearchIndex(memory);
  const hits = searchMemory(index, task, { limit: 12 }).hits;

  let anchorId: string | undefined;
  let anchorName: string | undefined;

  if (graph) {
    const topHit = hits[0];
    if (topHit) {
      anchorId = resolveNodeQuery(graph, topHit.title) ?? resolveNodeQuery(graph, task);
    } else {
      anchorId = resolveNodeQuery(graph, task);
    }
    if (anchorId) anchorName = graph.getNodeAttributes(anchorId).name;
  }

  const nodeMap = new Map<string, SubgraphNode>();
  const edgeSet = new Set<string>();
  const edges: SubgraphEdge[] = [];

  const addNode = (id: string, name: string, kind: string, path?: string) => {
    if (!nodeMap.has(id)) nodeMap.set(id, { id, name, kind, path });
  };

  if (graph && anchorId) {
    addNode(
      anchorId,
      graph.getNodeAttributes(anchorId).name,
      graph.getNodeAttributes(anchorId).kind,
      graph.getNodeAttributes(anchorId).path,
    );

    for (const [, pathNodes] of bfsPaths(graph, anchorId, maxHops)) {
      for (const nid of pathNodes) {
        const a = graph.getNodeAttributes(nid);
        addNode(nid, a.name, a.kind, a.path);
      }
    }
    for (const [, pathNodes] of reverseBfsPaths(graph, anchorId, maxHops)) {
      for (const nid of pathNodes) {
        const a = graph.getNodeAttributes(nid);
        addNode(nid, a.name, a.kind, a.path);
      }
    }

    for (const nid of nodeMap.keys()) {
      for (const n of getNeighbors(graph, nid, undefined, 'out').slice(0, 8)) {
        const key = `${nid}->${n.id}:out`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ from: graph.getNodeAttributes(nid).name, to: n.name, kind: 'out' });
        }
      }
    }
  }

  for (const hit of hits.slice(0, 8)) {
    addNode(`search:${hit.id}`, hit.title, hit.kind, hit.path);
  }

  const taskLower = task.toLowerCase();
  const domains = memory.domains
    .filter((d) => hits.some((h) => h.title === d.name) || taskLower.includes(d.name.toLowerCase()))
    .slice(0, 6)
    .map((d) => d.name);

  const flows = memory.flows
    .filter((f) => hits.some((h) => h.title === f.name) || taskLower.includes(f.name.toLowerCase()))
    .slice(0, 6)
    .map((f) => f.name);

  const capabilities = (memory.capabilities ?? [])
    .filter((c) => hits.some((h) => h.title === c.signature.name) || taskLower.includes(c.signature.name.toLowerCase()))
    .slice(0, 5)
    .map((c) => c.signature.name);

  const apis = memory.apis
    .filter((a) => hits.some((h) => h.title.includes(a.path)) || taskLower.includes(a.path.toLowerCase()))
    .slice(0, 8)
    .map((a) => `${a.method} ${a.path}`);

  const smells = memory.smells
    .filter((s) => domains.some((d) => s.description.toLowerCase().includes(d.toLowerCase())))
    .slice(0, 5)
    .map((s) => `${s.type}: ${s.description.slice(0, 80)}`);

  const criticalPaths = memory.criticalPaths
    .filter((c) => nodeMap.size === 0 || [...nodeMap.values()].some((n) => c.nodes.some((cn) => cn.includes(n.name))))
    .slice(0, 3)
    .map((c) => c.name);

  let impactSummary: string | undefined;
  if (graph && anchorId) {
    const impact = analyzeImpact(graph, anchorId);
    if (impact && impact.totalAffected > 0) {
      impactSummary = `${impact.totalAffected} nodes affected · ${impact.affectedFiles.length} files · ${impact.affectedApis.length} APIs`;
    }
  }

  const lines = [
    `# Task Context: ${task}`,
    '',
    anchorName ? `**Anchor:** ${anchorName}${impactSummary ? ` (${impactSummary})` : ''}` : null,
    '',
    domains.length ? `## Domains\n${domains.map((d) => `- ${d}`).join('\n')}` : null,
    flows.length ? `## Flows\n${flows.map((f) => `- ${f}`).join('\n')}` : null,
    capabilities.length ? `## Capabilities\n${capabilities.map((c) => `- ${c}`).join('\n')}` : null,
    apis.length ? `## APIs\n${apis.map((a) => `- ${a}`).join('\n')}` : null,
    smells.length ? `## Risks\n${smells.map((s) => `- ${s}`).join('\n')}` : null,
    criticalPaths.length ? `## Critical paths\n${criticalPaths.map((c) => `- ${c}`).join('\n')}` : null,
    '',
    '## Graph neighborhood',
    [...nodeMap.values()].slice(0, 20).map((n) => `- **${n.name}** (${n.kind})${n.path ? ` \`${n.path}\`` : ''}`).join('\n') || '- (search hits only)',
    edges.length ? `\n## Key edges\n${edges.slice(0, 12).map((e) => `- ${e.from} → ${e.to}`).join('\n')}` : '',
    '',
    '_Generated by Mnemos subgraph compiler — minimal context for this task._',
  ].filter(Boolean) as string[];

  let markdown = lines.join('\n');
  let estimatedTokens = Math.ceil(markdown.length / CHARS_PER_TOKEN);

  if (estimatedTokens > tokenBudget) {
    const optimized = optimizeContextWindow(markdown, tokenBudget, 6);
    markdown = optimized.text;
    estimatedTokens = optimized.tokensAfter;
  }

  const json: Record<string, unknown> = {
    task,
    anchor: anchorName,
    domains,
    flows,
    capabilities,
    apis,
    smells,
    criticalPaths,
    nodes: [...nodeMap.values()].slice(0, 30),
    edges: edges.slice(0, 20),
    impactSummary,
  };

  return {
    task,
    anchor: anchorName,
    tokenBudget,
    estimatedTokens,
    nodes: [...nodeMap.values()],
    edges,
    domains,
    flows,
    capabilities,
    apis,
    smells,
    criticalPaths,
    markdown,
    json,
  };
}

export function formatSubgraphContext(ctx: SubgraphContext): string {
  return ctx.markdown;
}
