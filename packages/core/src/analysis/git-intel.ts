import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { MemoryModel } from '../types.js';

const execFileAsync = promisify(execFile);

export interface GitHotspot {
  file: string;
  commits: number;
  service?: string;
  domain?: string;
  risk: 'low' | 'medium' | 'high';
}

export interface GitIntelSummary {
  available: boolean;
  windowCommits: number;
  hotspots: GitHotspot[];
  churnScore: number;
  message?: string;
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

export async function analyzeGitHotspots(
  root: string,
  memory: MemoryModel,
  options: { maxCommits?: number; limit?: number } = {},
): Promise<GitIntelSummary> {
  const maxCommits = options.maxCommits ?? 300;
  const limit = options.limit ?? 25;

  try {
    await runGit(root, ['rev-parse', '--is-inside-work-tree']);
  } catch {
    return { available: false, windowCommits: 0, hotspots: [], churnScore: 0, message: 'Not a git repository' };
  }

  try {
    const log = await runGit(root, [
      'log',
      `--max-count=${maxCommits}`,
      '--pretty=format:',
      '--name-only',
      '--',
    ]);

    const counts = new Map<string, number>();
    for (const line of log.split('\n')) {
      const file = line.trim().replace(/\\/g, '/');
      if (!file || file.startsWith('.mentis/')) continue;
      counts.set(file, (counts.get(file) ?? 0) + 1);
    }

    const serviceByPath = new Map<string, { name: string; domain?: string }>();
    for (const s of memory.services) {
      const norm = s.path.replace(/\\/g, '/');
      serviceByPath.set(norm, { name: s.name, domain: s.domain });
    }

    const hotspots: GitHotspot[] = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([file, commits]) => {
        const svc =
          serviceByPath.get(file) ??
          [...serviceByPath.entries()].find(([p]) => file.startsWith(p) || p.startsWith(file))?.[1];
        const risk: GitHotspot['risk'] = commits >= 15 ? 'high' : commits >= 6 ? 'medium' : 'low';
        return { file, commits, service: svc?.name, domain: svc?.domain, risk };
      });

    const churnScore = Math.min(100, Math.round(hotspots.slice(0, 10).reduce((s, h) => s + h.commits, 0) / 2));

    return {
      available: true,
      windowCommits: maxCommits,
      hotspots,
      churnScore,
    };
  } catch (err) {
    return {
      available: false,
      windowCommits: 0,
      hotspots: [],
      churnScore: 0,
      message: String(err),
    };
  }
}

export function enrichMemoryWithGitHotspots(
  memory: MemoryModel,
  intel: GitIntelSummary,
): Array<{ file: string; commits: number; service?: string; domain?: string }> {
  if (!intel.available) return [];
  return intel.hotspots.map((h) => ({
    file: h.file,
    commits: h.commits,
    service: h.service,
    domain: h.domain,
  }));
}

export function formatGitIntelReport(intel: GitIntelSummary): string {
  if (!intel.available) {
    return `# Git Intelligence\n\n_${intel.message ?? 'Git data unavailable'}_`;
  }

  const lines = [
    '# Git Hotspots',
    '',
    `Analyzed last **${intel.windowCommits}** commits · churn score **${intel.churnScore}/100**`,
    '',
    '| File | Commits | Service | Risk |',
    '|------|---------|---------|------|',
    ...intel.hotspots.slice(0, 15).map((h) => `| \`${h.file}\` | ${h.commits} | ${h.service ?? '—'} | ${h.risk} |`),
  ];

  return lines.join('\n');
}
