import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { patchGraph, shouldPatchGraph } from './incremental.js';
import { buildGraph } from './builder.js';
import type { ParsedFile } from '../types.js';

function sampleFile(relativePath: string, extra = ''): ParsedFile {
  return {
    path: `/repo/${relativePath}`,
    relativePath,
    language: 'typescript',
    symbols: [{ name: 'fn', kind: 'function', startLine: 1, endLine: 1, isExported: true, isDefaultExport: false }],
    imports: [],
    calls: [],
    exports: ['fn'],
    isTest: false,
    isRoute: false,
    hasUseServer: false,
    metadata: {},
    ...(extra ? {} : {}),
  };
}

describe('incremental graph patch', () => {
  it('shouldPatchGraph allows small change sets only', () => {
    assert.equal(shouldPatchGraph(100, 5, true), true);
    assert.equal(shouldPatchGraph(100, 50, true), false);
    assert.equal(shouldPatchGraph(100, 5, false), false);
  });

  it('patches changed files without full rebuild', () => {
    const scan = { files: [], packages: [], rootPackageName: 'demo' };
    const base = buildGraph('/repo', scan, [
      sampleFile('src/a.ts'),
      sampleFile('src/b.ts'),
    ]);

    const orderBefore = base.order;
    const patched = patchGraph(base, {
      root: '/repo',
      scan,
      parsedFiles: [
        {
          ...sampleFile('src/a.ts'),
          symbols: [{ name: 'updated', kind: 'function', startLine: 2, endLine: 2, isExported: true, isDefaultExport: false }],
          exports: ['updated'],
        },
        sampleFile('src/b.ts'),
      ],
      changedPaths: new Set(['src/a.ts']),
      deletedPaths: new Set(),
      entryPoints: new Set(),
      aliases: {},
    });

    assert.ok(patched.order >= orderBefore - 2);
    assert.ok([...patched.nodes()].some((id) => id.includes('src/a.ts')));
  });
});
