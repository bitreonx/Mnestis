import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { build, MnemosRuntime } from '../index.js';
import { createMcpServer } from '../mcp-server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.join(__dirname, '..', '..', 'test', 'fixtures', 'sample-app');

async function prepareBuiltRepo(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'mnemos-mcp-'));
  await cp(fixturesRoot, tmp, { recursive: true });
  await build({ root: tmp, incremental: false });
  return { root: tmp, cleanup: () => rm(tmp, { recursive: true, force: true }) };
}

describe('Mnemos MCP server', () => {
  it('lists tools/prompts/resources and supports structuredContent', async () => {
    const { root, cleanup } = await prepareBuiltRepo();

    try {
      const runtime = new MnemosRuntime(root);
      const server = createMcpServer(runtime);
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

      await server.connect(serverTransport);

      const client = new Client({ name: 'mnemos-test', version: '0.0.0' }, { capabilities: {} });
      await client.connect(clientTransport);

      const tools = await client.listTools();
      const toolNames = tools.tools.map((t) => t.name);
      assert.ok(toolNames.includes('get_status'));
      assert.ok(toolNames.includes('query_graph'));
      const statusTool = tools.tools.find((t) => t.name === 'get_status');
      assert.ok(statusTool?.annotations);
      assert.ok(statusTool?.outputSchema);

      const prompts = await client.listPrompts();
      assert.ok(prompts.prompts.some((p) => p.name === 'architecture-overview'));

      const resources = await client.listResources();
      assert.ok(resources.resources.some((r) => r.uri === 'mentis://repository/dna'));

      const statusResult = await client.callTool({ name: 'get_status', arguments: {} });
      assert.equal('content' in statusResult, true);
      if ('content' in statusResult) {
        assert.equal(statusResult.isError ?? false, false);
        assert.ok(statusResult.structuredContent);
        assert.equal((statusResult.structuredContent as any).ok, true);
        assert.equal((statusResult.structuredContent as any).tool, 'get_status');
      }

      const badQuery = await client.callTool({ name: 'query_graph', arguments: {} });
      assert.equal('content' in badQuery, true);
      if ('content' in badQuery) {
        assert.equal(badQuery.isError, true);
        assert.ok(badQuery.structuredContent);
        assert.equal((badQuery.structuredContent as any).ok, false);
        assert.equal((badQuery.structuredContent as any).data.error.code, 'INVALID_INPUT');
      }

      const dnaResource = await client.readResource({ uri: 'mentis://repository/dna' });
      assert.ok(dnaResource.contents.length >= 1);

      await clientTransport.close();
      await serverTransport.close();
    } finally {
      await cleanup();
    }
  });
});

