import path from 'node:path';

export interface McpServerConfigEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface CursorMcpConfig {
  mcpServers: Record<string, McpServerConfigEntry>;
}

/**
 * Generate a Cursor/Claude Desktop-compatible MCP server config for the local repo.
 * Uses npx so it works without global install.
 */
export function buildMcpServerConfig(root: string, options: { useGlobalMnemos?: boolean } = {}): CursorMcpConfig {
  const resolvedRoot = path.resolve(root);
  const entry: McpServerConfigEntry = options.useGlobalMnemos
    ? { command: 'mnemos', args: ['mcp', resolvedRoot] }
    : {
        command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
        args: ['-y', 'mnemos', 'mcp', resolvedRoot],
        env: { MNEMOS_ROOT: resolvedRoot },
      };

  return {
    mcpServers: {
      mnemos: {
        ...entry,
        env: { ...entry.env, MNEMOS_ROOT: resolvedRoot },
      },
    },
  };
}

export function formatMcpConfigJson(config: CursorMcpConfig): string {
  return JSON.stringify(config, null, 2);
}

export interface VscodeMcpServerConfigEntry {
  type: 'stdio';
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface VscodeMcpConfig {
  servers: Record<string, VscodeMcpServerConfigEntry>;
}

export function buildVscodeMcpServerConfig(root: string, options: { useGlobalMnemos?: boolean } = {}): VscodeMcpConfig {
  const resolvedRoot = path.resolve(root);
  const entry: VscodeMcpServerConfigEntry = options.useGlobalMnemos
    ? { type: 'stdio', command: 'mnemos', args: ['mcp', resolvedRoot], cwd: resolvedRoot }
    : {
        type: 'stdio',
        command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
        args: ['-y', 'mnemos', 'mcp', resolvedRoot],
        cwd: resolvedRoot,
        env: { MNEMOS_ROOT: resolvedRoot },
      };

  return { servers: { mnemos: entry } };
}

export function formatVscodeMcpConfigJson(config: VscodeMcpConfig): string {
  return JSON.stringify(config, null, 2);
}

export const MCP_SETUP_INSTRUCTIONS = `# Mnemos MCP Server

## Cursor

Add to Cursor → Settings → MCP, or merge into \`.cursor/mcp.json\`:

\`\`\`json
{cursorConfig}
\`\`\`

Then restart Cursor.

## VS Code

Create \`.vscode/mcp.json\` in your repository:

\`\`\`json
{vscodeConfig}
\`\`\`

Then restart VS Code.

## Claude Desktop

Open Claude Desktop → Settings → Developer → Edit Config, then add:

\`\`\`json
{cursorConfig}
\`\`\`

Then fully restart Claude Desktop.

The agent can query architecture, blast radius, and paths without reading the whole repo.

**Tools:** get_status, query_graph, get_dna, get_node, get_neighbors, shortest_path, impact_analysis, list_domains, list_flows, list_capabilities, search, get_health, review_diff, refresh_memory

**Resources:** mnemos://repository/dna, summary, agent-context, domains, flows, health, context/*
`;

export function buildMcpSetupMarkdown(root: string): string {
  const cursorConfig = formatMcpConfigJson(buildMcpServerConfig(root));
  const vscodeConfig = formatVscodeMcpConfigJson(buildVscodeMcpServerConfig(root));
  return MCP_SETUP_INSTRUCTIONS
    .replaceAll('{cursorConfig}', cursorConfig)
    .replaceAll('{vscodeConfig}', vscodeConfig);
}
