import type { AgentExports } from './agent-mode.js';
import { compactJson } from './util/compact-json.js';

/**
 * Node-only I/O for agent exports. Kept in a separate module so the pure
 * transformation in `./agent-mode.js` stays free of Node built-ins and is
 * safe to bundle into the UI.
 */
export async function writeAgentExports(
  exports: AgentExports,
  outputDir: string,
): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const path = await import('node:path');
  await mkdir(outputDir, { recursive: true });

  // Compact JSON for agent-facing exports — fewer tokens, same semantics.
  const dnaJson = compactJson(exports.dna);
  const contextJson = compactJson(exports.context);

  const files: Record<string, string> = {
    'project.dna.json': dnaJson,
    'repository.dna.json': dnaJson,
    'agent_context.json': contextJson,
    'agent-context.json': contextJson,
    'repository_summary.json': compactJson(exports.summary),
    'repository-summary.json': compactJson(exports.summary),
    'architecture-agent.json': compactJson(exports.architecture),
    'critical_paths.json': compactJson(exports.criticalPaths),
  };

  for (const [filename, content] of Object.entries(files)) {
    await writeFile(path.join(outputDir, filename), content, 'utf-8');
  }
}
