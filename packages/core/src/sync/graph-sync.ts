import path from 'node:path';
import { watch, type FSWatcher } from 'node:fs';
import { build } from '../pipeline/build.js';
import type { BuildResult } from '../types.js';

export interface GraphSyncOptions {
  root: string;
  outputDir?: string;
  debounceMs?: number;
  incremental?: boolean;
  verbose?: boolean;
  onStart?: () => void;
  onSuccess?: (result: BuildResult) => void;
  onError?: (error: unknown) => void;
}

export interface GraphSyncHandle {
  stop: () => void;
}

const IGNORE = ['node_modules', '.mnemos', '.git', 'dist', 'build', '.next', 'coverage'];

function shouldIgnore(filename: string): boolean {
  const f = filename.replace(/\\/g, '/');
  if (IGNORE.some((seg) => f.includes(`/${seg}/`) || f.startsWith(`${seg}/`) || f.includes(seg))) return true;
  if (f.endsWith('.map') || f.endsWith('.lock') || f.includes('package-lock.json')) return true;
  return false;
}

/**
 * Codegraph-style local graph sync: incremental rebuild on filesystem changes.
 */
export async function startGraphSync(options: GraphSyncOptions): Promise<GraphSyncHandle> {
  const root = path.resolve(options.root);
  const outputDir = options.outputDir ?? path.join(root, '.mnemos');
  const debounceMs = options.debounceMs ?? 400;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;
  let watcher: FSWatcher | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;

  const run = async () => {
    if (stopped || running) return;
    running = true;
    options.onStart?.();
    try {
      const result = await build({
        root,
        outputDir,
        incremental: options.incremental !== false,
        verbose: options.verbose,
      });
      options.onSuccess?.(result);
    } catch (err) {
      options.onError?.(err);
    } finally {
      running = false;
    }
  };

  const trigger = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void run(), debounceMs);
  };

  await run();

  const recursive = process.platform !== 'win32';
  try {
    watcher = watch(
      root,
      { recursive, persistent: true },
      (_event, filename) => {
        if (!filename || shouldIgnore(String(filename))) return;
        trigger();
      },
    );
  } catch {
    poll = setInterval(trigger, 2000);
  }

  return {
    stop: () => {
      stopped = true;
      if (debounce) clearTimeout(debounce);
      watcher?.close();
      if (poll) clearInterval(poll);
    },
  };
}
