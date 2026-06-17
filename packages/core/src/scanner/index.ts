import fg from 'fast-glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ScanResult } from '../types.js';
import {
  ALL_SOURCE_EXTENSIONS,
  SOURCE_GLOB_PATTERN,
  inferLanguage,
  isSupportedSourceFile,
} from '../languages/index.js';

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.mnemos/**',
  '**/vendor/**',
  '**/.turbo/**',
  '**/.expo/**',
  '**/android/**',
  '**/ios/**',
];

/** Extensionless infra files detected by basename (Dockerfile, Makefile, …). */
const BASENAME_GLOB_PATTERNS = [
  '**/Dockerfile',
  '**/Dockerfile.*',
  '**/Makefile',
  '**/GNUmakefile',
  '**/CMakeLists.txt',
];

export async function scanRepository(
  root: string,
  extraIgnore: string[] = [],
  maxFiles = 50_000,
): Promise<ScanResult> {
  const normalizedRoot = path.resolve(root);
  const patterns = [SOURCE_GLOB_PATTERN, ...BASENAME_GLOB_PATTERNS];

  const files = await fg(patterns, {
    cwd: normalizedRoot,
    absolute: true,
    ignore: [...DEFAULT_IGNORE, ...extraIgnore],
    onlyFiles: true,
    followSymbolicLinks: false,
    caseSensitiveMatch: false,
  });

  const limited = files
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ALL_SOURCE_EXTENSIONS.has(ext) || isSupportedSourceFile(f);
    })
    .slice(0, maxFiles);

  const packages = await detectPackages(normalizedRoot);

  let rootPackageName: string | undefined;
  try {
    const pkgRaw = await readFile(path.join(normalizedRoot, 'package.json'), 'utf-8');
    rootPackageName = JSON.parse(pkgRaw).name;
  } catch {
    // no root package.json
  }

  return {
    files: limited,
    packages,
    rootPackageName,
  };
}

async function detectPackages(root: string): Promise<string[]> {
  const packageJsonFiles = await fg('**/package.json', {
    cwd: root,
    absolute: true,
    ignore: DEFAULT_IGNORE,
    onlyFiles: true,
  });

  return packageJsonFiles
    .map((f) => path.dirname(path.relative(root, f)))
    .filter((p) => p !== '' && !p.startsWith('..'))
    .sort((a, b) => a.localeCompare(b));
}

export { inferLanguage } from '../languages/index.js';

export function isTestFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.includes('__tests__') ||
    normalized.includes('/test/') ||
    normalized.includes('/tests/') ||
    normalized.includes('/spec/') ||
    normalized.includes('/specs/') ||
    /\.(test|spec)\.[a-z0-9]+$/i.test(normalized) ||
    /_test\.(go|rs|py|rb|java|kt|swift|cs)$/i.test(normalized) ||
    /test_[a-z0-9_]+\.py$/i.test(normalized) ||
    /^test_[a-z0-9_]+\.py$/i.test(path.basename(normalized))
  );
}

export function inferRoutePath(relativePath: string): string | undefined {
  const normalized = relativePath.replace(/\\/g, '/');

  // Next.js App Router
  const appMatch = normalized.match(/(?:^|\/)app\/(.+?)\/(page|route)\.(tsx?|jsx?)$/);
  if (appMatch) {
    let route = appMatch[1]!
      .replace(/\[\.\.\.([^\]]+)\]/g, '*')
      .replace(/\[([^\]]+)\]/g, ':$1');
    if (route.endsWith('/page') || route.endsWith('/route')) {
      route = route.replace(/\/(page|route)$/, '');
    }
    return '/' + route.replace(/\/page$/, '').replace(/\/route$/, '');
  }

  // Expo Router
  const expoMatch = normalized.match(/(?:^|\/)app\/(.+)\.(tsx?|jsx?)$/);
  if (expoMatch && !expoMatch[1]!.includes('_layout')) {
    let route = expoMatch[1]!
      .replace(/\[\.\.\.([^\]]+)\]/g, '*')
      .replace(/\[([^\]]+)\]/g, ':$1')
      .replace(/\/index$/, '');
    return '/' + route;
  }

  return undefined;
}

export function inferDomainFromPath(relativePath: string): string | undefined {
  const normalized = relativePath.replace(/\\/g, '/');

  const patterns = [
    /(?:^|\/)features\/([^/]+)/,
    /(?:^|\/)domains\/([^/]+)/,
    /(?:^|\/)modules\/([^/]+)/,
    /(?:^|\/)server\/([^/]+)/,
    /(?:^|\/)src\/features\/([^/]+)/,
    /(?:^|\/)lib\/([^/]+)/,
    /(?:^|\/)packages\/([^/]+)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const segment = match[1]!;
      if (['test', 'tests', 'spec', 'e2e', 'examples', 'example'].includes(segment)) continue;
      return formatDomainName(segment);
    }
  }

  if (/^(?:lib|src)\//.test(normalized)) {
    return formatDomainName(normalized.startsWith('lib/') ? 'Core Library' : 'Source');
  }

  return undefined;
}

export function formatDomainName(raw: string): string {
  return raw
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function inferServiceName(relativePath: string, packages: string[]): string | undefined {
  const normalized = relativePath.replace(/\\/g, '/');

  for (const pkg of packages) {
    const pkgNorm = pkg.replace(/\\/g, '/');
    if (normalized.startsWith(pkgNorm + '/') || normalized === pkgNorm) {
      return pkgNorm.split('/').pop() ?? pkgNorm;
    }
  }

  const topLevel = normalized.split('/')[0];
  return topLevel && !topLevel.includes('.') ? topLevel : undefined;
}
