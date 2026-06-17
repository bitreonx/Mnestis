import path from 'node:path';
import { readFile } from 'node:fs/promises';

const ENTRY_BASENAMES = new Set([
  'index.ts',
  'index.tsx',
  'index.js',
  'index.jsx',
  'main.ts',
  'main.js',
  'app.ts',
  'app.tsx',
  'server.ts',
  'cli.ts',
]);

function normalizeRel(root: string, target: string): string {
  const abs = path.isAbsolute(target) ? target : path.join(root, target);
  return path.relative(root, abs).replace(/\\/g, '/');
}

function expandExportTarget(value: string, root: string): string[] {
  const rel = normalizeRel(root, value.replace(/^\.\//, ''));
  const out = [rel];
  if (!rel.match(/\.(tsx?|jsx?|mjs|cjs)$/i)) {
    out.push(`${rel}/index.ts`, `${rel}/index.tsx`, `${rel}/index.js`);
  }
  return out;
}

export async function discoverPackageEntryPoints(root: string): Promise<Set<string>> {
  const entries = new Set<string>();

  try {
    const raw = await readFile(path.join(root, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as {
      main?: string;
      module?: string;
      types?: string;
      bin?: string | Record<string, string>;
      exports?: Record<string, unknown> | string;
    };

    for (const field of [pkg.main, pkg.module, pkg.types]) {
      if (typeof field === 'string') {
        for (const p of expandExportTarget(field, root)) entries.add(p);
      }
    }

    if (typeof pkg.bin === 'string') {
      for (const p of expandExportTarget(pkg.bin, root)) entries.add(p);
    } else if (pkg.bin && typeof pkg.bin === 'object') {
      for (const target of Object.values(pkg.bin)) {
        if (typeof target === 'string') {
          for (const p of expandExportTarget(target, root)) entries.add(p);
        }
      }
    }

    if (pkg.exports) {
      collectExportMapEntries(pkg.exports, root, entries);
    }
  } catch {
    // no package.json
  }

  for (const name of ENTRY_BASENAMES) {
    entries.add(`src/${name}`);
    entries.add(name);
  }

  return entries;
}

function collectExportMapEntries(
  exportsField: Record<string, unknown> | string,
  root: string,
  out: Set<string>,
): void {
  if (typeof exportsField === 'string') {
    for (const p of expandExportTarget(exportsField, root)) out.add(p);
    return;
  }

  for (const [key, value] of Object.entries(exportsField)) {
    if (key === 'types') continue;
    if (typeof value === 'string') {
      for (const p of expandExportTarget(value, root)) out.add(p);
      continue;
    }
    if (value && typeof value === 'object') {
      const cond = value as Record<string, string>;
      for (const sub of Object.values(cond)) {
        if (typeof sub === 'string') {
          for (const p of expandExportTarget(sub, root)) out.add(p);
        }
      }
    }
  }
}

export function isPackageEntryPoint(relativePath: string, entryPoints: Set<string>): boolean {
  const norm = relativePath.replace(/\\/g, '/');
  if (entryPoints.has(norm)) return true;
  return [...entryPoints].some((e) => norm.endsWith(`/${e}`) || norm === e);
}
