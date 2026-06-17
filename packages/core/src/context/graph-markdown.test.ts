import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraphsIndexMarkdown } from './graph-markdown.js';
import { buildDomainGraphMermaid, wrapMermaid } from '../graph/mermaid.js';
import type { MemoryModel } from '../types.js';

function sampleMemory(): MemoryModel {
  return {
    repository: 'demo-app',
    builtAt: new Date().toISOString(),
    architecture: {
      name: 'demo-app',
      type: 'Monorepo',
      summary: 'Demo repository for graph markdown tests.',
      layers: ['API', 'Services', 'Data'],
      packages: ['packages/core'],
      languages: { typescript: 40, python: 10 },
    },
    domains: [
      {
        id: 'auth',
        name: 'Auth',
        description: 'Authentication domain',
        confidence: 0.9,
        nodes: ['n1', 'n2'],
        entryPoints: ['src/auth/login.ts'],
      },
    ],
    flows: [
      {
        id: 'login',
        name: 'Login Flow',
        type: 'request',
        entryPoint: '/login',
        confidence: 0.85,
        description: 'User sign-in path',
        steps: [
          { name: 'Route', kind: 'route', path: 'app/login/page.tsx', nodeId: 'n1' },
          { name: 'AuthService', kind: 'service', path: 'src/auth/service.ts', nodeId: 'n2' },
        ],
      },
    ],
    services: [
      {
        id: 'auth-svc',
        name: 'AuthService',
        path: 'src/auth/service.ts',
        domain: 'Auth',
        dependencies: ['UserRepo'],
        dependents: ['LoginHandler'],
        exports: ['authenticate'],
      },
    ],
    apis: [],
    dependencies: [{ from: 'AuthService', to: 'UserRepo', kind: 'IMPORTS', weight: 1 }],
    criticalPaths: [
      {
        id: 'cp1',
        name: 'Login Path',
        risk: 'high',
        description: 'Central auth path',
        nodes: ['src/auth/service.ts'],
      },
    ],
    deadCode: [],
    smells: [],
    capabilities: [],
    journeys: [],
    stats: {
      filesScanned: 50,
      nodesCreated: 120,
      edgesCreated: 200,
      domainsFound: 1,
      flowsFound: 1,
      durationMs: 100,
    },
  };
}

describe('graph markdown', () => {
  it('buildGraphsIndexMarkdown includes all major diagram sections', () => {
    const md = buildGraphsIndexMarkdown(sampleMemory());
    assert.match(md, /# Architecture Graphs/);
    assert.match(md, /```mermaid/);
    assert.match(md, /Domain map/);
    assert.match(md, /Service dependencies/);
    assert.match(md, /Language distribution/);
    assert.match(md, /Extractor routing/);
    assert.match(md, /Language families/);
  });

  it('buildDomainGraphMermaid escapes unsafe labels', () => {
    const memory = sampleMemory();
    memory.domains[0]!.name = 'Auth Special Zone';
    const md = buildDomainGraphMermaid(memory);
    assert.match(md, /```mermaid/);
    assert.match(md, /flowchart LR/);
  });

  it('wrapMermaid produces fenced blocks', () => {
    const fenced = wrapMermaid('flowchart LR\n  A --> B');
    assert.match(fenced, /^```mermaid/);
    assert.match(fenced, /A --> B/);
  });
});
