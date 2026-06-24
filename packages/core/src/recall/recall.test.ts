import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decayScore, evictByDecay } from './decay-score.js';
import { pack, formatPackSavings } from './pack.js';
import { summarizeCold } from './summarize-cold.js';
import type { MemoryNode, PackableMemory } from './types.js';

describe('decayScore', () => {
  it('scores recent frequent memories higher than stale ones', () => {
    const now = Date.now();
    const fresh: MemoryNode = {
      id: 'a',
      content: 'recent',
      relevance: 1,
      lastAccessedAt: new Date(now).toISOString(),
      accessCount: 10,
    };
    const stale: MemoryNode = {
      id: 'b',
      content: 'old',
      relevance: 1,
      lastAccessedAt: new Date(now - 30 * 24 * 3_600_000).toISOString(),
      accessCount: 0,
    };
    assert.ok(decayScore(fresh, { now }) > decayScore(stale, { now }));
  });

  it('evicts TTL-expired nodes', () => {
    const expired: MemoryNode = {
      id: 'x',
      content: 'gone',
      relevance: 1,
      expiresAt: '2020-01-01T00:00:00.000Z',
    };
    assert.equal(decayScore(expired), 0);
    const { evicted } = evictByDecay([expired]);
    assert.equal(evicted.length, 1);
  });
});

describe('pack', () => {
  it('greedy knapsack selects highest relevance/token ratio', () => {
    const memories: PackableMemory[] = [
      { id: 'big', content: 'x'.repeat(4000), relevance: 0.9 },
      { id: 'small', content: 'compact high value memory', relevance: 0.85 },
      { id: 'med', content: 'medium '.repeat(100), relevance: 0.5 },
    ];
    const result = pack(memories, 50);
    assert.ok(result.included.some((m) => m.id === 'small'));
    assert.ok(result.tokensUsed <= 50);
    assert.ok(result.tokensSaved > 0);
    assert.match(formatPackSavings(result), /saved \d+%/);
  });

  it('trim-to-fit includes partial high-value memory when budget is tight', () => {
    const memories: PackableMemory[] = [
      { id: 'huge', content: 'word '.repeat(500), relevance: 0.95 },
      { id: 'tiny', content: 'fix auth redirect', relevance: 0.9 },
    ];
    const result = pack(memories, 20);
    assert.ok(result.included.length >= 1);
    assert.ok(result.tokensUsed <= 20);
    assert.ok(result.included.some((m) => m.id === 'tiny') || result.included.some((m) => m.content.includes('…')));
  });

  it('returns all dropped when budget is zero', () => {
    const memories: PackableMemory[] = [{ id: 'a', content: 'hello', relevance: 1 }];
    const result = pack(memories, 0);
    assert.equal(result.included.length, 0);
    assert.equal(result.dropped.length, 1);
  });
});

describe('summarizeCold', () => {
  it('compresses nodes older than cold threshold', () => {
    const old = new Date(Date.now() - 200 * 3_600_000).toISOString();
    const nodes: MemoryNode[] = [
      {
        id: 'cold',
        content:
          'This is a long memory about authentication middleware and JWT validation flows. ' +
          'It includes session handling, refresh tokens, and OAuth2 redirect URI validation for multiple providers.',
        relevance: 0.8,
        lastAccessedAt: old,
        tags: ['auth'],
      },
      {
        id: 'hot',
        content: 'Fresh observation from today.',
        relevance: 0.9,
        lastAccessedAt: new Date().toISOString(),
      },
    ];
    const summaries = summarizeCold(nodes, { coldAfterHours: 168, maxChars: 80 });
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]!.id, 'cold');
    assert.ok(summaries[0]!.savedTokens >= 0);
    assert.ok(summaries[0]!.summary.length < nodes[0]!.content.length);
  });
});
