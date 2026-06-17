import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractPythonAst } from './python-ast.js';
import { extractGoAst } from './go-ast.js';

describe('Python AST extractor', () => {
  it('parses parenthesized from-imports and async defs', () => {
    const code = `
from auth.service import (
    AuthService as Auth,
    login,
)

async def fetch_user():
    Auth.login()
`;
    const result = extractPythonAst(code);
    assert.ok(result);
    assert.ok(result.imports.some((i) => i.specifiers.includes('Auth')));
    assert.ok(result.symbols.some((s) => s.name === 'fetch_user' && s.kind === 'function'));
    assert.ok(result.calls.some((c) => c.callee.includes('Auth.login')));
  });

  it('reads __all__ exports', () => {
    const code = `__all__ = ['login', 'logout']\ndef login(): pass`;
    const result = extractPythonAst(code)!;
    assert.ok(result.exports.includes('login'));
    assert.ok(result.exports.includes('logout'));
  });
});

describe('Go AST extractor', () => {
  it('parses aliased imports and exported symbols', () => {
    const code = `
package main

import (
    httpx "net/http"
    "fmt"
)

func Serve() {}

type User struct {}
`;
    const result = extractGoAst(code);
    assert.ok(result);
    assert.ok(result.imports.some((i) => i.specifiers.includes('httpx')));
    assert.ok(result.symbols.some((s) => s.name === 'Serve' && s.isExported));
    assert.ok(result.exports.includes('Serve'));
  });
});
