import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImportMaps,
  buildReexportAliases,
  resolveCallTargetSymbol,
  resolveSymbolKey,
} from '../graph/import-resolution.js';
import type { ParsedFile } from '../types.js';

const files: ParsedFile[] = [
  {
    path: '/p/src/auth/service.ts',
    relativePath: 'src/auth/service.ts',
    language: 'typescript',
    symbols: [
      {
        name: 'AuthService',
        kind: 'class',
        startLine: 1,
        endLine: 10,
        isExported: true,
        isDefaultExport: false,
      },
      {
        name: 'login',
        kind: 'function',
        startLine: 12,
        endLine: 20,
        isExported: true,
        isDefaultExport: false,
      },
    ],
    imports: [],
    calls: [],
    exports: ['AuthService', 'login'],
    isTest: false,
    isRoute: false,
    hasUseServer: false,
    metadata: {},
  },
  {
    path: '/p/src/index.ts',
    relativePath: 'src/index.ts',
    language: 'typescript',
    symbols: [],
    imports: [{ source: './auth/service', specifiers: ['AuthService', 'login'], isTypeOnly: false }],
    calls: [],
    exports: ['AuthService', 'login'],
    isTest: false,
    isRoute: false,
    hasUseServer: false,
    metadata: {},
  },
  {
    path: '/p/src/app/login.ts',
    relativePath: 'src/app/login.ts',
    language: 'typescript',
    symbols: [],
    imports: [{ source: '../index', specifiers: ['AuthService'], isTypeOnly: false }],
    calls: [{ callee: 'AuthService.login', line: 5 }],
    exports: [],
    isTest: false,
    isRoute: false,
    hasUseServer: false,
    metadata: {},
  },
];

describe('import resolution', () => {
  it('maps every named import specifier to its target file', () => {
    const allPaths = files.map((f) => f.relativePath);
    const maps = buildImportMaps(files, allPaths, {}, []);
    const barrel = maps.get('src/index.ts');
    assert.ok(barrel?.get('AuthService') === 'src/auth/service.ts');
    assert.ok(barrel?.get('login') === 'src/auth/service.ts');
  });

  it('follows re-export chains to resolve call targets', () => {
    const allPaths = files.map((f) => f.relativePath);
    const reexports = buildReexportAliases(files, allPaths, {}, []);
    assert.equal(
      resolveSymbolKey('src/index.ts#AuthService', reexports),
      'src/auth/service.ts#AuthService',
    );

    const symbolIndex = new Map<string, string>([
      ['src/auth/service.ts#AuthService', 'sym:auth'],
      ['src/auth/service.ts#login', 'sym:login'],
    ]);
    const localImports = buildImportMaps(files, allPaths, {}, []).get('src/app/login.ts')!;

    const target = resolveCallTargetSymbol(
      'AuthService.login',
      localImports,
      symbolIndex,
      reexports,
    );
    assert.equal(target, 'sym:login');
  });
});
