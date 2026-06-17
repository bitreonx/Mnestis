import type { MemoryModel } from './types.js';
import type { MnemosGraph } from './graph/graph.js';
import { getNeighbors, shortestPath } from './graph/graph.js';
import { resolveNodeQuery } from './graph/builder.js';
import { askCopilot } from './copilot.js';
import { analyzeImpact, formatImpactReport } from './analysis/impact.js';
import { findDomain } from './analysis/domains.js';
import { buildSearchIndex, searchMemory } from './search/index.js';

export interface GraphQueryResult {
  question: string;
  answer: string;
  confidence: number;
  paths?: string[][];
  relatedNodes?: string[];
  hits?: import('./search/index.js').SearchHit[];
}

export interface PathResult {
  from: string;
  to: string;
  path: string[];
  labels: string[];
  found: boolean;
}

export interface NodeExplainResult {
  name: string;
  nodeId?: string;
  kind?: string;
  path?: string;
  domain?: string;
  neighbors: { in: string[]; out: string[] };
  impact?: { totalAffected: number; summary: string };
  service?: { dependencies: string[]; dependents: string[] };
  relatedFlows: string[];
  text: string;
}

export function queryGraph(
  memory: MemoryModel,
  question: string,
  graph?: MnemosGraph,
  searchIndex?: import('./search/index.js').MemorySearchIndex,
): GraphQueryResult {
  const base = askCopilot(memory, question, { graph, searchIndex });
  const connectMatch = question.match(/what connects?\s+(.+?)\s+(?:to|with)\s+(.+?)[?.!]*$/i);

  if (graph && connectMatch) {
    const fromQ = connectMatch[1]!.trim();
    const toQ = connectMatch[2]!.trim();
    const fromId = resolveNodeQuery(graph, fromQ);
    const toId = resolveNodeQuery(graph, toQ);

    if (fromId && toId) {
      const path = shortestPath(graph, fromId, toId);
      const labels = path?.map((id) => graph.getNodeAttributes(id).name) ?? [];

      if (path && path.length > 0) {
        const depEdges = memory.dependencies.filter(
          (d) =>
            labels.some((l) => d.from.toLowerCase().includes(l.toLowerCase())) &&
            labels.some((l) => d.to.toLowerCase().includes(l.toLowerCase())),
        );

        const edgeLines =
          depEdges.length > 0
            ? depEdges.slice(0, 8).map((d) => `  • ${d.from} → ${d.to} (${d.kind})`).join('\n')
            : '  (inferred via graph traversal)';

    return {
      question,
      answer: `${base.answer}\n\n**Connection path (${fromQ} → ${toQ}):**\n${labels.join(' → ')}\n\n**Dependency edges along path:**\n${edgeLines}`,
      confidence: Math.max(base.confidence, 0.88),
      paths: [path],
      relatedNodes: labels,
      hits: base.hits,
    };
      }

      return {
        question,
        answer: `${base.answer}\n\nNo direct graph path found between **${fromQ}** and **${toQ}**. They may be in separate domains or connected indirectly.`,
        confidence: base.confidence * 0.8,
        paths: [],
        relatedNodes: [],
      };
    }
  }

  if (graph && /connect|path|route|link|between/i.test(question)) {
    const index = searchIndex ?? buildSearchIndex(memory);
    const hits = searchMemory(index, question, { limit: 4 }).hits;
    const nodeNames = hits.map((h) => h.title);
    const paths: string[][] = [];

    if (nodeNames.length >= 2) {
      const a = resolveNodeQuery(graph, nodeNames[0]!);
      const b = resolveNodeQuery(graph, nodeNames[1]!);
      if (a && b) {
        const p = shortestPath(graph, a, b);
        if (p) {
          paths.push(p);
          const labels = p.map((id) => graph.getNodeAttributes(id).name);
          return {
            question,
            answer: `${base.answer}\n\n**Likely connection:** ${labels.join(' → ')}`,
            confidence: Math.max(base.confidence, 0.75),
            paths,
            relatedNodes: labels,
          };
        }
      }
    }
  }

  return {
    question,
    answer: base.answer,
    confidence: base.confidence,
    relatedNodes: base.relatedTopics,
    hits: base.hits,
  };
}

export function findGraphPath(
  graph: MnemosGraph,
  fromQuery: string,
  toQuery: string,
): PathResult {
  const fromId = resolveNodeQuery(graph, fromQuery);
  const toId = resolveNodeQuery(graph, toQuery);

  if (!fromId || !toId) {
    return {
      from: fromQuery,
      to: toQuery,
      path: [],
      labels: [],
      found: false,
    };
  }

  const path = shortestPath(graph, fromId, toId) ?? [];
  const labels = path.map((id) => {
    const attrs = graph.getNodeAttributes(id);
    return attrs.path ? `${attrs.name} (${attrs.path})` : attrs.name;
  });

  return {
    from: graph.getNodeAttributes(fromId).name,
    to: graph.getNodeAttributes(toId).name,
    path,
    labels,
    found: path.length > 0,
  };
}

export function explainNode(
  memory: MemoryModel,
  nodeQuery: string,
  graph?: MnemosGraph,
): NodeExplainResult {
  const service = memory.services.find(
    (s) =>
      s.name.toLowerCase() === nodeQuery.toLowerCase() ||
      s.name.toLowerCase().includes(nodeQuery.toLowerCase()) ||
      s.path.toLowerCase().includes(nodeQuery.toLowerCase()),
  );

  let nodeId: string | undefined;
  let kind: string | undefined;
  let nodePath: string | undefined;
  let name = nodeQuery;

  if (graph) {
    nodeId = resolveNodeQuery(graph, nodeQuery);
    if (nodeId) {
      const attrs = graph.getNodeAttributes(nodeId);
      name = attrs.name;
      kind = attrs.kind;
      nodePath = attrs.path;
    }
  }

  const domain = service?.domain
    ? memory.domains.find((d) => d.id === service.domain || d.name === service.domain)?.name
    : findDomain(memory.domains, nodeQuery)?.name;

  const neighbors = { in: [] as string[], out: [] as string[] };
  if (graph && nodeId) {
    neighbors.in = getNeighbors(graph, nodeId, undefined, 'in').map((n) => n.name);
    neighbors.out = getNeighbors(graph, nodeId, undefined, 'out').map((n) => n.name);
  } else if (service) {
    neighbors.in = service.dependents;
    neighbors.out = service.dependencies;
  }

  let impact: NodeExplainResult['impact'];
  if (graph && nodeId) {
    const result = analyzeImpact(graph, nodeId);
    if (result) {
      impact = {
        totalAffected: result.totalAffected,
        summary: formatImpactReport(result, graph).split('\n').slice(0, 6).join('\n'),
      };
    }
  }

  const relatedFlows = memory.flows
    .filter((f) =>
      f.steps.some(
        (s) =>
          s.name.toLowerCase().includes(name.toLowerCase()) ||
          (s.path?.toLowerCase().includes(nodeQuery.toLowerCase()) ?? false),
      ),
    )
    .slice(0, 5)
    .map((f) => f.name);

  const lines = [
    `# ${name}`,
    '',
    kind ? `**Kind:** ${kind}` : null,
    nodePath ? `**Path:** \`${nodePath}\`` : service ? `**Path:** \`${service.path}\`` : null,
    domain ? `**Domain:** ${domain}` : null,
    '',
    '## Neighbors',
    `**Dependents (in):** ${neighbors.in.slice(0, 10).join(', ') || 'none'}`,
    `**Dependencies (out):** ${neighbors.out.slice(0, 10).join(', ') || 'none'}`,
  ].filter(Boolean) as string[];

  if (impact) {
    lines.push('', '## Impact', `**Blast radius:** ${impact.totalAffected} nodes`, impact.summary);
  }

  if (relatedFlows.length > 0) {
    lines.push('', '## Related flows', ...relatedFlows.map((f) => `- ${f}`));
  }

  const critical = memory.criticalPaths.find((c) =>
    c.name.toLowerCase().includes(name.toLowerCase()),
  );
  if (critical) {
    lines.push('', '## Critical path', `- **${critical.name}** (${critical.risk} risk): ${critical.description}`);
  }

  return {
    name,
    nodeId,
    kind,
    path: nodePath ?? service?.path,
    domain,
    neighbors,
    impact,
    service: service
      ? { dependencies: service.dependencies, dependents: service.dependents }
      : undefined,
    relatedFlows,
    text: lines.join('\n'),
  };
}

export function formatPathResult(result: PathResult): string {
  if (!result.found) {
    return `No path found between "${result.from}" and "${result.to}".`;
  }
  return `Path from **${result.from}** → **${result.to}** (${result.labels.length} hops):\n\n${result.labels.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;
}

export function formatNodeExplain(result: NodeExplainResult): string {
  return result.text;
}
