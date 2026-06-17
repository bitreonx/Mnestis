import type { GraphNode } from '../types.js';
import type { MnemosGraph } from './graph.js';

export interface GraphNodeIndex {
  byExactName: Map<string, string>;
  byExactId: Map<string, string>;
  byPath: Map<string, string>;
  byToken: Map<string, Set<string>>;
  entryById: Map<string, { id: string; name: string; path: string; kind: string }>;
  entries: Array<{ id: string; name: string; path: string; kind: string }>;
}

const indexCache = new WeakMap<MnemosGraph, GraphNodeIndex>();

function addToken(map: Map<string, Set<string>>, token: string, nodeId: string): void {
  if (token.length < 2) return;
  if (!map.has(token)) map.set(token, new Set());
  map.get(token)!.add(nodeId);
}

function tokenizePath(path: string): string[] {
  return path
    .toLowerCase()
    .replace(/[^\w/.-]/g, ' ')
    .split(/[/\\.\s_-]+/)
    .filter((t) => t.length > 1);
}

export function buildNodeQueryIndex(graph: MnemosGraph): GraphNodeIndex {
  const byExactName = new Map<string, string>();
  const byExactId = new Map<string, string>();
  const byPath = new Map<string, string>();
  const byToken = new Map<string, Set<string>>();
  const entryById = new Map<string, { id: string; name: string; path: string; kind: string }>();
  const entries: GraphNodeIndex['entries'] = [];

  graph.forEachNode((id: string, attrs: GraphNode) => {
    const name = attrs.name.toLowerCase();
    const pathKey = (attrs.path ?? '').toLowerCase().replace(/\\/g, '/');
    const entry = { id, name: attrs.name, path: attrs.path ?? '', kind: attrs.kind };
    entries.push(entry);
    entryById.set(id, entry);

    if (name && !byExactName.has(name)) byExactName.set(name, id);
    byExactId.set(id.toLowerCase(), id);
    if (pathKey && !byPath.has(pathKey)) byPath.set(pathKey, id);

    addToken(byToken, name, id);
    addToken(byToken, id.toLowerCase(), id);
    for (const token of tokenizePath(pathKey)) addToken(byToken, token, id);
    for (const token of name.split(/(?=[A-Z])|[_-]/).map((t) => t.toLowerCase()).filter(Boolean)) {
      addToken(byToken, token, id);
    }
  });

  return { byExactName, byExactId, byPath, byToken, entryById, entries };
}

export function getNodeQueryIndex(graph: MnemosGraph): GraphNodeIndex {
  const cached = indexCache.get(graph);
  if (cached) return cached;
  const built = buildNodeQueryIndex(graph);
  indexCache.set(graph, built);
  return built;
}

export function resolveNodeQueryFast(
  graph: MnemosGraph,
  query: string,
  index?: GraphNodeIndex,
): string | undefined {
  const idx = index ?? getNodeQueryIndex(graph);
  const normalized = query.toLowerCase().trim();
  if (!normalized) return undefined;

  const exact =
    idx.byExactName.get(normalized) ??
    idx.byExactId.get(normalized) ??
    idx.byPath.get(normalized.replace(/\\/g, '/'));
  if (exact) return exact;

  const terms = normalized.split(/\s+/).filter((t) => t.length > 1);
  const candidates = new Set<string>();

  for (const term of terms) {
    idx.byToken.get(term)?.forEach((id) => candidates.add(id));
    for (const [token, ids] of idx.byToken) {
      if (token.includes(term) || term.includes(token)) {
        ids.forEach((id) => candidates.add(id));
      }
    }
  }

  if (candidates.size === 0 && terms.length === 1) {
    for (const entry of idx.entries) {
      const hay = `${entry.name} ${entry.path}`.toLowerCase();
      if (hay.includes(normalized)) candidates.add(entry.id);
    }
  }

  let bestId: string | undefined;
  let bestScore = 0;

  const scoreNode = (id: string, haystack: string, name: string): number => {
    let score = 0;
    if (name.toLowerCase() === normalized) score += 12;
    if (id.toLowerCase() === normalized) score += 12;
    for (const term of terms) {
      if (name.toLowerCase() === term) score += 6;
      if (haystack.includes(term)) score += 2;
    }
    return score;
  };

  for (const id of candidates) {
    const entry = idx.entryById.get(id);
    if (!entry) continue;
    const haystack = [entry.id, entry.name, entry.path].join(' ').toLowerCase();
    const score = scoreNode(id, haystack, entry.name);
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestScore > 0 ? bestId : undefined;
}
