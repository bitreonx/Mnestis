import { spawn } from 'node:child_process';

/** Open a file path in the system default browser (best-effort). */
export function openInBrowser(filePath: string): void {
  try {
    const opener =
      process.platform === 'win32'
        ? `start "" "${filePath}"`
        : process.platform === 'darwin'
          ? `open "${filePath}"`
          : `xdg-open "${filePath}"`;
    spawn(opener, { shell: true, stdio: 'ignore', detached: true });
  } catch {
    /* ignore */
  }
}
