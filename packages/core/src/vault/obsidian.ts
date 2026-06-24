import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { MemoryModel } from '../types.js';

export interface ObsidianVaultResult {
  vaultDir: string;
  filesWritten: number;
  indexPath: string;
}

function slug(name: string): string {
  return name.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}

function wikilink(name: string): string {
  return `[[${name.replace(/\]/g, '')}]]`;
}

/**
 * Export repository memory as an Obsidian-compatible markdown vault with wikilinks.
 * Beats graph-only tools: human-browseable + agent-queryable in one artifact tree.
 */
export async function exportObsidianVault(
  memory: MemoryModel,
  outputDir: string,
): Promise<ObsidianVaultResult> {
  const vaultDir = path.join(outputDir, 'vault');
  const domainsDir = path.join(vaultDir, 'domains');
  const flowsDir = path.join(vaultDir, 'flows');
  await mkdir(domainsDir, { recursive: true });
  await mkdir(flowsDir, { recursive: true });

  let filesWritten = 0;

  for (const d of memory.domains) {
    const name = d.name;
    const file = path.join(domainsDir, `${slug(name)}.md`);
    const relatedFlows = memory.flows
      .filter((f) => f.description?.toLowerCase().includes(name.toLowerCase()) || f.name.toLowerCase().includes(name.toLowerCase()))
      .slice(0, 12);
    const body = [
      `# ${name}`,
      '',
      `> Domain · ${memory.repository}`,
      '',
      d.description ? `${d.description}\n` : '',
      '## Stats',
      `- **Nodes:** ${d.nodes?.length ?? 0}`,
      `- **Entry points:** ${d.entryPoints?.length ?? 0}`,
      '',
      relatedFlows.length ? '## Related flows\n' + relatedFlows.map((f) => `- ${wikilink(f.name)}`).join('\n') : '',
      '',
      '---',
      `tags: [mnestis, domain]`,
    ].join('\n');
    await writeFile(file, body, 'utf8');
    filesWritten++;
  }

  for (const f of memory.flows.slice(0, 80)) {
    const file = path.join(flowsDir, `${slug(f.name)}.md`);
    const body = [
      `# ${f.name}`,
      '',
      `> Flow · entry: \`${f.entryPoint ?? 'unknown'}\``,
      '',
      f.description ? `${f.description}\n` : '',
      f.steps?.length
        ? '## Steps\n' + f.steps.slice(0, 20).map((s, i) => `${i + 1}. ${s.name}${s.path ? ` (\`${s.path}\`)` : ''}`).join('\n')
        : '',
      '',
      '---',
      `tags: [mnestis, flow]`,
    ].join('\n');
    await writeFile(file, body, 'utf8');
    filesWritten++;
  }

  const indexPath = path.join(vaultDir, 'Home.md');
  const indexBody = [
    `# ${memory.repository} — Mnestis Vault`,
    '',
    'Open this folder as an Obsidian vault, or browse in any markdown editor.',
    '',
    '## Domains',
    ...memory.domains.slice(0, 40).map((d) => `- ${wikilink(d.name)} → \`domains/${slug(d.name)}.md\``),
    '',
    '## Flows',
    ...memory.flows.slice(0, 20).map((f) => `- ${wikilink(f.name)} → \`flows/${slug(f.name)}.md\``),
    '',
    '## Agent commands',
    '```bash',
    'mnestis memory context "your task" --budget 4000',
    'mnestis memory query "auth middleware"',
    '```',
    '',
    '---',
    'generated_by: mnestis',
  ].join('\n');
  await writeFile(indexPath, indexBody, 'utf8');
  filesWritten++;

  return { vaultDir, filesWritten, indexPath };
}
