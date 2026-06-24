import path from 'node:path';
import { access, rename } from 'node:fs/promises';
import { MNESTIS_MEMORY_DIR, LEGACY_MEMORY_DIR } from './ai-toolkit.js';

/** Resolve the active memory directory, migrating legacy `.mnemos` → `.mentis` when present. */
export async function resolveMemoryDir(root: string): Promise<string> {
  const mentisDir = path.join(root, MNESTIS_MEMORY_DIR);
  const legacyDir = path.join(root, LEGACY_MEMORY_DIR);

  try {
    await access(mentisDir);
    return mentisDir;
  } catch {
    // fall through
  }

  try {
    await access(legacyDir);
    await rename(legacyDir, mentisDir);
    return mentisDir;
  } catch {
    return mentisDir;
  }
}

export function memoryDirForRoot(root: string): string {
  return path.join(path.resolve(root), MNESTIS_MEMORY_DIR);
}
