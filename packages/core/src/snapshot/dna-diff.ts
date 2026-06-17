import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MemoryModel } from '../types.js';
import { computeMemoryScore } from '../report.js';

export interface DnaSnapshot {
  builtAt: string;
  repository: string;
  stats: MemoryModel['stats'];
  healthScore: number;
  domainNames: string[];
  flowNames: string[];
  capabilityNames: string[];
  smellCount: number;
  highSmellCount: number;
  apiCount: number;
  serviceCount: number;
}

export interface DnaDiffChange {
  kind: 'added' | 'removed' | 'changed';
  category: string;
  items: string[];
  detail?: string;
}

export interface DnaDiffResult {
  hasPrevious: boolean;
  previousBuiltAt?: string;
  currentBuiltAt: string;
  changes: DnaDiffChange[];
  summary: string;
  regressionRisk: 'none' | 'low' | 'medium' | 'high';
}

const HISTORY_FILE = 'build-history.json';
const MAX_HISTORY = 50;

export function snapshotFromMemory(memory: MemoryModel): DnaSnapshot {
  const score = computeMemoryScore(memory);
  return {
    builtAt: memory.builtAt,
    repository: memory.repository,
    stats: { ...memory.stats },
    healthScore: score.overall,
    domainNames: memory.domains.map((d) => d.name).sort(),
    flowNames: memory.flows.map((f) => f.name).sort(),
    capabilityNames: (memory.capabilities ?? []).map((c) => c.signature.name).sort(),
    smellCount: memory.smells.length,
    highSmellCount: memory.smells.filter((s) => s.severity === 'high').length,
    apiCount: memory.apis.length,
    serviceCount: memory.services.length,
  };
}

function diffLists(prev: string[], curr: string[]): { added: string[]; removed: string[] } {
  const prevSet = new Set(prev);
  const currSet = new Set(curr);
  return {
    added: curr.filter((x) => !prevSet.has(x)),
    removed: prev.filter((x) => !currSet.has(x)),
  };
}

export function compareDnaSnapshots(previous: DnaSnapshot, current: DnaSnapshot): DnaDiffResult {
  const changes: DnaDiffChange[] = [];

  const domains = diffLists(previous.domainNames, current.domainNames);
  if (domains.added.length) changes.push({ kind: 'added', category: 'domains', items: domains.added });
  if (domains.removed.length) changes.push({ kind: 'removed', category: 'domains', items: domains.removed });

  const flows = diffLists(previous.flowNames, current.flowNames);
  if (flows.added.length) changes.push({ kind: 'added', category: 'flows', items: flows.added });
  if (flows.removed.length) changes.push({ kind: 'removed', category: 'flows', items: flows.removed });

  const caps = diffLists(previous.capabilityNames, current.capabilityNames);
  if (caps.added.length) changes.push({ kind: 'added', category: 'capabilities', items: caps.added });
  if (caps.removed.length) changes.push({ kind: 'removed', category: 'capabilities', items: caps.removed });

  if (previous.healthScore !== current.healthScore) {
    changes.push({
      kind: 'changed',
      category: 'health',
      items: [`${previous.healthScore} → ${current.healthScore}`],
      detail: current.healthScore < previous.healthScore ? 'Health score decreased' : 'Health score improved',
    });
  }

  if (previous.smellCount !== current.smellCount || previous.highSmellCount !== current.highSmellCount) {
    changes.push({
      kind: 'changed',
      category: 'smells',
      items: [`${previous.smellCount} → ${current.smellCount} total`, `${previous.highSmellCount} → ${current.highSmellCount} high`],
    });
  }

  if (previous.stats.nodesCreated !== current.stats.nodesCreated) {
    changes.push({
      kind: 'changed',
      category: 'graph',
      items: [`${previous.stats.nodesCreated} → ${current.stats.nodesCreated} nodes`],
    });
  }

  let regressionRisk: DnaDiffResult['regressionRisk'] = 'none';
  if (current.healthScore < previous.healthScore - 5 || current.highSmellCount > previous.highSmellCount) {
    regressionRisk = 'high';
  } else if (domains.removed.length > 0 || flows.removed.length > 0 || current.healthScore < previous.healthScore) {
    regressionRisk = 'medium';
  } else if (changes.length > 0) {
    regressionRisk = 'low';
  }

  const summary =
    changes.length === 0
      ? 'No structural changes since last build.'
      : `${changes.length} change group(s): ${changes.map((c) => c.category).join(', ')}`;

  return {
    hasPrevious: true,
    previousBuiltAt: previous.builtAt,
    currentBuiltAt: current.builtAt,
    changes,
    summary,
    regressionRisk,
  };
}

export async function loadBuildHistory(outputDir: string): Promise<DnaSnapshot[]> {
  try {
    const raw = await readFile(path.join(outputDir, HISTORY_FILE), 'utf-8');
    const parsed = JSON.parse(raw) as { snapshots?: DnaSnapshot[] };
    return parsed.snapshots ?? [];
  } catch {
    return [];
  }
}

export async function appendBuildSnapshot(memory: MemoryModel, outputDir: string): Promise<DnaDiffResult> {
  const current = snapshotFromMemory(memory);
  const history = await loadBuildHistory(outputDir);
  const previous = history.length > 0 ? history[history.length - 1] : undefined;

  const nextHistory = [...history, current].slice(-MAX_HISTORY);
  await writeFile(
    path.join(outputDir, HISTORY_FILE),
    JSON.stringify({ version: 1, snapshots: nextHistory, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  );

  if (!previous) {
    return {
      hasPrevious: false,
      currentBuiltAt: current.builtAt,
      changes: [],
      summary: 'First build snapshot recorded.',
      regressionRisk: 'none',
    };
  }

  return compareDnaSnapshots(previous, current);
}

export function formatDnaDiffReport(diff: DnaDiffResult): string {
  const lines = [
    '# DNA Diff',
    '',
    diff.hasPrevious ? `**Previous:** ${diff.previousBuiltAt}` : '**Previous:** (none)',
    `**Current:** ${diff.currentBuiltAt}`,
    `**Risk:** ${diff.regressionRisk}`,
    '',
    diff.summary,
    '',
  ];

  for (const change of diff.changes) {
    lines.push(`## ${change.kind.toUpperCase()} ${change.category}`);
    for (const item of change.items) lines.push(`- ${item}`);
    if (change.detail) lines.push(`  _${change.detail}_`);
    lines.push('');
  }

  return lines.join('\n');
}
