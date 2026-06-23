import path from 'node:path';

export interface McpServerConfigEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface CursorMcpConfig {
  mcpServers: Record<string, McpServerConfigEntry>;
}

const MCP_PACKAGE = 'mnestis';

function mcpEntry(root: string, useGlobal: boolean): McpServerConfigEntry {
  const resolvedRoot = path.resolve(root);
  if (useGlobal) {
    return { command: MCP_PACKAGE, args: ['mcp', resolvedRoot], env: { MNESTIS_ROOT: resolvedRoot } };
  }
  return {
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['-y', MCP_PACKAGE, 'mcp', resolvedRoot],
    env: { MNESTIS_ROOT: resolvedRoot, MNEMOS_ROOT: resolvedRoot },
  };
}

/**
 * Generate a Cursor/Claude Desktop-compatible MCP server config for the local repo.
 * Uses npx so it works without global install.
 */
export function buildMcpServerConfig(root: string, options: { useGlobalMnemos?: boolean } = {}): CursorMcpConfig {
  const resolvedRoot = path.resolve(root);
  const entry = mcpEntry(root, options.useGlobalMnemos ?? false);
  return {
    mcpServers: {
      mnestis: { ...entry, env: { ...entry.env, MNESTIS_ROOT: resolvedRoot, MNEMOS_ROOT: resolvedRoot } },
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
  const base = mcpEntry(root, options.useGlobalMnemos ?? false);
  const entry: VscodeMcpServerConfigEntry = {
    type: 'stdio',
    command: base.command,
    args: base.args,
    cwd: resolvedRoot,
    env: base.env,
  };
  return { servers: { mnestis: entry } };
}

export function formatVscodeMcpConfigJson(config: VscodeMcpConfig): string {
  return JSON.stringify(config, null, 2);
}

export const MCP_SETUP_INSTRUCTIONS = `# Mnestis MCP Server

## Cursor

Add to Cursor → Settings → MCP, or merge into \`.cursor/mcp.json\`:

\`\`\`json
{cursorConfig}
\`\`\`

Then restart Cursor. The server name is **mnestis** — agents must call these tools before grepping the repo.

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

**Prefer MCP over manual file reads** for architecture questions.

**Tools:** get_status, query_graph, get_dna, get_node, get_neighbors, shortest_path, impact_analysis, list_domains, list_flows, list_capabilities, search, get_health, review_diff, refresh_memory

**Resources:** mnestis://repository/dna, summary, agent-context, domains, flows, health, context/*
`;

export function buildMcpSetupMarkdown(root: string): string {
  const cursorConfig = formatMcpConfigJson(buildMcpServerConfig(root));
  const vscodeConfig = formatVscodeMcpConfigJson(buildVscodeMcpServerConfig(root));
  return MCP_SETUP_INSTRUCTIONS.replaceAll('{cursorConfig}', cursorConfig).replaceAll('{vscodeConfig}', vscodeConfig);
}
