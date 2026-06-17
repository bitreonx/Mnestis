import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'node:path';
import {
  MnemosRuntime,
  MNEMOS_VERSION,
  envelopeToMcpContent,
  errorToMcpContent,
} from './agent-runtime.js';
import { PROMPTS, TOOL_REGISTRY, buildPromptMessages, getToolOrThrow } from './mcp/registry.js';

export interface McpServerOptions {
  root: string;
  /** Log lifecycle events to stderr (stdio-safe). */
  verbose?: boolean;
}

const SERVER_INSTRUCTIONS = `Mnemos is the local-first memory layer for this repository.

Workflow for AI agents:
1. Call \`get_dna\` (preferred) OR read \`mnemos://repository/dna\` — not both; they return the same data
2. Use \`query_graph\` for architecture questions (graph + BM25, typically <15ms warm)
3. Call \`impact_analysis\` before editing central services
4. Use \`shortest_path\` to trace connections between components
5. Call \`refresh_memory\` after \`mnemos build\` to reload artifacts

No API keys. No network. All analysis runs from \`.mnemos/\`.
Disable MCP preview after adding mnemos to avoid duplicate server processes.`;

function log(verbose: boolean | undefined, message: string): void {
  if (verbose) process.stderr.write(`[mnemos-mcp] ${message}\n`);
}

export function createMcpServer(runtime: MnemosRuntime, options: { verbose?: boolean } = {}): Server {
  const server = new Server(
    { name: 'mnemos', version: MNEMOS_VERSION, description: SERVER_INSTRUCTIONS },
    {
      capabilities: { tools: {}, resources: {}, prompts: {} },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_REGISTRY.map((t) => t.definition) }));

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: runtime.listResources().map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { mimeType, text } = await runtime.readResource(String(request.params.uri));
    return { contents: [{ uri: request.params.uri, mimeType, text }] };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS.map((p) => ({ name: p.name, description: p.description, arguments: p.arguments })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return buildPromptMessages(runtime, name, args);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const tool = getToolOrThrow(name);
      const normalized = tool.normalize(args);
      const envelope = await tool.run(runtime, normalized);

      return {
        content: envelopeToMcpContent(envelope),
        structuredContent: {
          ok: envelope.ok,
          tool: envelope.tool,
          summary: envelope.summary,
          data: envelope.data,
          meta: envelope.meta,
        },
      };
    } catch (err) {
      return errorToMcpContent(err, name, runtime);
    }
  });

  const statusPromise = runtime.getStatus();
  statusPromise.then((status) => {
    log(options.verbose, `root=${runtime.root} ready=${status.ready} graph=${status.graphAvailable}`);
    if (!status.ready) {
      log(options.verbose, 'WARN: memory not built — run `npx mnemos .` in project root');
    }
  }).catch(() => {});

  return server;
}

export async function startMcpServer(options: McpServerOptions): Promise<void> {
  const root = path.resolve(options.root);
  const runtime = new MnemosRuntime(root);
  const server = createMcpServer(runtime, { verbose: options.verbose });

  const transport = new StdioServerTransport();
  log(options.verbose, 'stdio transport connected — awaiting MCP client');
  await server.connect(transport);
}
