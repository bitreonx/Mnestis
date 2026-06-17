import path from 'node:path';

import type { ParsedFile, ScanResult } from '../types.js';

import { addEdge, addNode, createGraph, type MnemosGraph } from './graph.js';

import { resolveNodeQueryFast } from './node-index.js';

import { loadPathAliases, type PathAliasMap } from './paths.js';

import { addParsedFileNodes, wireGraphEdges } from './incremental.js';



let cachedAliases: { root: string; aliases: PathAliasMap } | null = null;



export async function buildGraphAsync(
  root: string,
  scan: ScanResult,
  parsedFiles: ParsedFile[],
  entryPoints: Set<string> = new Set(),
): Promise<MnemosGraph> {
  if (!cachedAliases || cachedAliases.root !== root) {
    const aliases = await loadPathAliases(root);
    cachedAliases = { root, aliases };
  }
  return buildGraphWithAliases(root, scan, parsedFiles, cachedAliases.aliases, entryPoints);
}

export function buildGraph(
  root: string,
  scan: ScanResult,
  parsedFiles: ParsedFile[],
  entryPoints: Set<string> = new Set(),
): MnemosGraph {
  const defaultAliases: PathAliasMap = { '@/': ['src/'] };
  return buildGraphWithAliases(
    root,
    scan,
    parsedFiles,
    cachedAliases?.root === root ? cachedAliases.aliases : defaultAliases,
    entryPoints,
  );
}

function buildGraphWithAliases(
  root: string,
  scan: ScanResult,
  parsedFiles: ParsedFile[],
  aliases: PathAliasMap,
  entryPoints: Set<string>,
): MnemosGraph {

  const graph = createGraph();

  const repoName = scan.rootPackageName ?? path.basename(root);

  const repoId = addNode(graph, 'repository', repoName, { path: root });



  const fileIndex = new Map<string, string>();
  const symbolIndex = new Map<string, string>();



  for (const pkg of scan.packages) {

    const pkgId = addNode(graph, 'package', path.basename(pkg) || repoName, {

      path: pkg,

      metadata: { fullPath: pkg },

    });

    addEdge(graph, repoId, pkgId, 'OWNS');

  }



  for (const file of parsedFiles) {
    addParsedFileNodes(graph, file, scan, entryPoints, fileIndex, symbolIndex);
  }

  wireGraphEdges(graph, parsedFiles, scan, aliases, fileIndex, symbolIndex);

  return graph;
}



export function resolveNodeQuery(graph: MnemosGraph, query: string): string | undefined {
  return resolveNodeQueryFast(graph, query);
}


