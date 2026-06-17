import type { ImpactResult } from '../types.js';
import type { MnemosGraph } from '../graph/graph.js';
import { bfsPaths, reverseBfsPaths } from '../graph/graph.js';
import { resolveNodeQuery } from '../graph/builder.js';

export function analyzeImpact(graph: MnemosGraph, query: string): ImpactResult | null {
  const nodeId = resolveNodeQuery(graph, query);
  if (!nodeId) return null;

  const forwardPaths = bfsPaths(graph, nodeId, 8);
  const reversePaths = reverseBfsPaths(graph, nodeId, 8);
  const affectedApis: string[] = [];
  const affectedDomains: string[] = [];
  const affectedTests: string[] = [];
  const affectedFiles: string[] = [];
  const allPaths: string[][] = [];

  const collectAffected = (targetId: string, pathNodes: string[]) => {
    allPaths.push(pathNodes);
    const attrs = graph.getNodeAttributes(targetId);

    switch (attrs.kind) {
      case 'api':
      case 'route':
        affectedApis.push(attrs.name);
        break;
      case 'domain':
        affectedDomains.push(attrs.name);
        break;
      case 'test':
        affectedTests.push(attrs.path ?? attrs.name);
        break;
      case 'file':
      case 'service':
        affectedFiles.push(attrs.path ?? attrs.name);
        break;
    }
  };

  for (const [targetId, pathNodes] of forwardPaths) {
    collectAffected(targetId, pathNodes);
  }

  for (const [targetId, pathNodes] of reversePaths) {
    collectAffected(targetId, pathNodes);
  }

  const unique = <T>(arr: T[]): T[] => [...new Set(arr)];
  const allAffected = unique([
    ...affectedApis,
    ...affectedDomains,
    ...affectedTests,
    ...affectedFiles,
  ]);

  return {
    node: nodeId,
    affectedApis: unique(affectedApis),
    affectedDomains: unique(affectedDomains),
    affectedTests: unique(affectedTests),
    affectedFiles: unique(affectedFiles),
    totalAffected: allAffected.length,
    paths: allPaths.slice(0, 20),
  };
}

export function formatImpactReport(result: ImpactResult, graph: MnemosGraph): string {
  const nodeAttrs = graph.getNodeAttributes(result.node);
  const lines = [
    `Impact Analysis: ${nodeAttrs.name}`,
    `${'='.repeat(50)}`,
    '',
    `Total affected nodes: ${result.totalAffected} (forward + reverse dependency closure)`,
    '',
    `APIs affected (${result.affectedApis.length}):`,
    ...result.affectedApis.slice(0, 15).map((a) => `  • ${a}`),
    '',
    `Domains affected (${result.affectedDomains.length}):`,
    ...result.affectedDomains.slice(0, 10).map((d) => `  • ${d}`),
    '',
    `Tests affected (${result.affectedTests.length}):`,
    ...result.affectedTests.slice(0, 10).map((t) => `  • ${t}`),
    '',
    `Files affected (${result.affectedFiles.length}):`,
    ...result.affectedFiles.slice(0, 15).map((f) => `  • ${f}`),
  ];

  return lines.join('\n');
}
