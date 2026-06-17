import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMemoryModel } from '../pipeline/build.js';
import { loadPersistedGraph } from '../pipeline/build.js';
import { loadOrBuildSearchIndex } from '../search/index.js';
import { compileSubgraphContext } from './subgraph-compiler.js';

const fixturesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'test', 'fixtures', 'sample-app');

describe('subgraph compiler', () => {
  it('builds task-scoped context within token budget quickly', async () => {
    const loaded = await loadMemoryModel(fixturesRoot);
    if (!loaded) return;

    const [graph, searchIndex] = await Promise.all([
      loadPersistedGraph(loaded.outputDir),
      loadOrBuildSearchIndex(loaded.memory, loaded.outputDir),
    ]);

    const start = Date.now();
    const ctx = compileSubgraphContext(loaded.memory, 'fix login authentication flow', graph, {
      tokenBudget: 4000,
      searchIndex,
    });
    const tookMs = Date.now() - start;

    assert.ok(ctx.markdown.length > 50);
    assert.ok(ctx.estimatedTokens <= 4000);
    assert.ok(tookMs < 100, `compile took ${tookMs}ms`);
  });
});
