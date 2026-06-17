import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { buildLanguagesReferenceMarkdown } from '../languages/docs.js';
import { buildArchitectureReferenceMarkdown, buildGraphsReferenceMarkdown } from './reference.js';

export interface SyncDocsResult {
  written: string[];
  root: string;
}

/** Write static repo docs from Mnemos generators (docs/LANGUAGES.md, docs/GRAPHS.md, docs/architecture.md). */
export async function syncMnemosDocs(repoRoot: string): Promise<SyncDocsResult> {
  const docsDir = path.join(repoRoot, 'docs');
  await mkdir(docsDir, { recursive: true });

  const files: Record<string, string> = {
    'LANGUAGES.md': buildLanguagesReferenceMarkdown(),
    'GRAPHS.md': buildGraphsReferenceMarkdown(),
    'architecture.md': buildArchitectureReferenceMarkdown(),
  };

  const written: string[] = [];
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(docsDir, name);
    await writeFile(target, content.endsWith('\n') ? content : `${content}\n`, 'utf-8');
    written.push(path.relative(repoRoot, target).replace(/\\/g, '/'));
  }

  return { written, root: repoRoot };
}
