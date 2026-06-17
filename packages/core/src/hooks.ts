import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

export interface HookStatus {
  installed: boolean;
  postCommit: boolean;
  postCheckout: boolean;
  gitDir: string;
  hookPaths: { postCommit: string; postCheckout: string };
}

const HOOK_MARKER = '# mnemos-auto-rebuild';

function buildHookScript(): string {
  if (process.platform === 'win32') {
    return `@echo off
${HOOK_MARKER}
where mnemos >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  where npx >nul 2>&1
  if %ERRORLEVEL% NEQ 0 exit /b 0
  npx mnemos build >nul 2>&1
) else (
  mnemos build >nul 2>&1
)
exit /b 0
`;
  }

  return `#!/bin/sh
${HOOK_MARKER}
if command -v mnemos >/dev/null 2>&1; then
  mnemos build >/dev/null 2>&1
elif command -v npx >/dev/null 2>&1; then
  npx mnemos build >/dev/null 2>&1
fi
exit 0
`;
}

function findGitDir(root: string): string | undefined {
  const direct = path.join(root, '.git');
  if (existsSync(direct)) {
    if (existsSync(path.join(direct, 'hooks'))) return direct;
  }

  let current = root;
  for (let i = 0; i < 10; i++) {
    const gitDir = path.join(current, '.git');
    if (existsSync(gitDir) && existsSync(path.join(gitDir, 'hooks'))) return gitDir;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return undefined;
}

export function getHookStatus(root: string): HookStatus {
  const gitDir = findGitDir(path.resolve(root));
  const hookPaths = {
    postCommit: gitDir ? path.join(gitDir, 'hooks', 'post-commit') : '',
    postCheckout: gitDir ? path.join(gitDir, 'hooks', 'post-checkout') : '',
  };

  if (!gitDir) {
    return { installed: false, postCommit: false, postCheckout: false, gitDir: '', hookPaths };
  }

  const postCommit = hookHasMarker(hookPaths.postCommit);
  const postCheckout = hookHasMarker(hookPaths.postCheckout);

  return {
    installed: postCommit || postCheckout,
    postCommit,
    postCheckout,
    gitDir,
    hookPaths,
  };
}

function hookHasMarker(hookPath: string): boolean {
  if (!existsSync(hookPath)) return false;
  try {
    return readFileSync(hookPath, 'utf-8').includes(HOOK_MARKER);
  } catch {
    return false;
  }
}

async function writeHook(hookPath: string, script: string): Promise<void> {
  const { readFile, writeFile, chmod } = await import('node:fs/promises');
  const { mkdir } = await import('node:fs/promises');

  await mkdir(path.dirname(hookPath), { recursive: true });

  let existing = '';
  try {
    existing = await readFile(hookPath, 'utf-8');
  } catch {
    /* new hook */
  }

  if (existing.includes(HOOK_MARKER)) return;

  const content = existing ? `${existing.trimEnd()}\n\n${script}` : script;
  await writeFile(hookPath, content, 'utf-8');

  if (process.platform !== 'win32') {
    await chmod(hookPath, 0o755);
  }
}

async function removeHookMarker(hookPath: string): Promise<boolean> {
  const { readFile, writeFile, unlink } = await import('node:fs/promises');

  try {
    const content = await readFile(hookPath, 'utf-8');
    if (!content.includes(HOOK_MARKER)) return false;

    const lines = content.split('\n');
    const filtered: string[] = [];
    let skip = false;

    for (const line of lines) {
      if (line.includes(HOOK_MARKER)) {
        skip = true;
        continue;
      }
      if (skip) {
        if (process.platform === 'win32') {
          if (line.startsWith('exit /b')) {
            skip = false;
          }
          continue;
        }
        if (line === 'exit 0' || line === 'exit 0\r') {
          skip = false;
          continue;
        }
        if (line.startsWith('#!/') && !line.includes(HOOK_MARKER)) {
          skip = false;
          filtered.push(line);
        }
        continue;
      }
      filtered.push(line);
    }

    const cleaned = filtered.join('\n').trimEnd();
    if (cleaned.trim()) {
      await writeFile(hookPath, cleaned + '\n', 'utf-8');
    } else {
      await unlink(hookPath);
    }
    return true;
  } catch {
    return false;
  }
}

export async function installHooks(root: string): Promise<{ installed: string[]; errors: string[] }> {
  const status = getHookStatus(root);
  const installed: string[] = [];
  const errors: string[] = [];

  if (!status.gitDir) {
    errors.push('No .git directory found');
    return { installed, errors };
  }

  const script = buildHookScript();

  try {
    await writeHook(status.hookPaths.postCommit, script);
    installed.push('post-commit');
  } catch (e) {
    errors.push(`post-commit: ${e}`);
  }

  try {
    await writeHook(status.hookPaths.postCheckout, script.replace('post-commit', 'post-checkout'));
    installed.push('post-checkout');
  } catch (e) {
    errors.push(`post-checkout: ${e}`);
  }

  return { installed, errors };
}

export async function uninstallHooks(root: string): Promise<{ removed: string[] }> {
  const status = getHookStatus(root);
  const removed: string[] = [];

  if (await removeHookMarker(status.hookPaths.postCommit)) removed.push('post-commit');
  if (await removeHookMarker(status.hookPaths.postCheckout)) removed.push('post-checkout');

  return { removed };
}
