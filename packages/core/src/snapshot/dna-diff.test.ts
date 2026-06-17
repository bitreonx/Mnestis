import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareDnaSnapshots, snapshotFromMemory } from './dna-diff.js';
import type { MemoryModel } from '../types.js';

function mockMemory(overrides: Partial<MemoryModel> = {}): MemoryModel {
  return {
    repository: 'test-repo',
    builtAt: new Date().toISOString(),
    stats: { filesScanned: 10, nodesCreated: 50, edgesCreated: 80, domainsFound: 2, flowsFound: 3, durationMs: 100 },
    architecture: { name: 'test-repo', type: 'Monolith', summary: 'test', layers: ['app'], packages: [], languages: { typescript: 10 } },
    domains: [{ id: 'd1', name: 'Auth', confidence: 0.9, nodes: [], description: '', entryPoints: [] }],
    flows: [{ id: 'f1', name: 'Login', type: 'request', confidence: 0.8, steps: [], entryPoint: '/login', description: '' }],
    services: [],
    apis: [],
    dependencies: [],
    criticalPaths: [],
    deadCode: [],
    smells: [],
    capabilities: [],
    journeys: [],
    ...overrides,
  };
}

describe('DNA diff', () => {
  it('detects added domains and health regression', () => {
    const prev = snapshotFromMemory(mockMemory());
    const curr = snapshotFromMemory(
      mockMemory({
        domains: [
          { id: 'd1', name: 'Auth', confidence: 0.9, nodes: [], description: '', entryPoints: [] },
          { id: 'd2', name: 'Billing', confidence: 0.8, nodes: [], description: '', entryPoints: [] },
        ],
        smells: [{ id: 's1', type: 'god_service', severity: 'high', nodes: [], description: 'x', recommendation: 'y' }],
      }),
    );

    curr.healthScore = prev.healthScore - 10;
    const diff = compareDnaSnapshots(prev, curr);
    assert.ok(diff.changes.some((c) => c.category === 'domains' && c.kind === 'added'));
    assert.equal(diff.regressionRisk, 'high');
  });
});
