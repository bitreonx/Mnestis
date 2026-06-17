import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractTsAst } from './ts-ast.js';

describe('TypeScript AST extractor', () => {
  it('extracts dynamic import() as dependency edge', () => {
    const code = `
export async function load() {
  const mod = await import('./lazy-module');
  return mod.run();
}
`;
    const result = extractTsAst(code, 'src/load.ts', 'typescript');
    assert.ok(result);
    assert.ok(result.imports.some((i) => i.source === './lazy-module' && i.specifiers.includes('*dynamic*')));
  });

  it('extracts export * re-exports', () => {
    const code = `export * from './auth/service';`;
    const result = extractTsAst(code, 'src/index.ts', 'typescript');
    assert.ok(result);
    assert.ok(result.imports.some((i) => i.source === './auth/service' && i.specifiers.includes('*reexport*')));
  });

  it('extracts re-exports and named exports', () => {
    const code = `
export { AuthService } from './auth/service';
export const login = () => {};
`;
    const result = extractTsAst(code, 'src/index.ts', 'typescript');
    assert.ok(result);
    assert.ok(result.imports.some((i) => i.source === './auth/service'));
    assert.ok(result.exports.includes('login'));
  });
});
