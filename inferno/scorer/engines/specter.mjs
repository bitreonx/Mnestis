/**
 * SPECTER — Security Protocol for Evaluation Contamination & Tamper Evidence Recording.
 * Path sandboxing, repo allowlists, SHA-256 integrity manifests.
 */
import { createHash } from 'node:crypto';
import path from 'node:path';

export const ALLOWED_REPO_IDS = new Set(['express', 'nestjs', 'nextjs', 'vscode']);

export function assertSafeRepoId(repoId) {
  if (!repoId || typeof repoId !== 'string') throw new Error('SPECTER: repo id required');
  if (!/^[a-z0-9-]+$/.test(repoId)) throw new Error(`SPECTER: invalid repo id "${repoId}"`);
  if (!ALLOWED_REPO_IDS.has(repoId)) throw new Error(`SPECTER: repo "${repoId}" not in allowlist`);
  return repoId;
}

export function assertWithinBenchRoot(resolvedPath, benchRoot) {
  const normalized = path.resolve(resolvedPath);
  const root = path.resolve(benchRoot);
  const rel = path.relative(root, normalized);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`SPECTER: path escapes bench root — ${resolvedPath}`);
  }
  return normalized;
}

export function sha256(data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(payload).digest('hex');
}

export function buildIntegrityManifest(result) {
  const core = {
    benchmark: result.benchmark,
    repo: result.repo,
    commit_sha: result.commit_sha,
    dataset_version: result.dataset_version,
    measured_at: result.measured_at,
    MNESTIS: {
      accuracy: result.tools?.MNESTIS?.accuracy,
      tier: result.tools?.MNESTIS?.verification_tier,
      tasks_verified: result.tools?.MNESTIS?.tasks_verified,
    },
  };
  return {
    algorithm: 'SPECTER-SHA256-v1',
    hash: sha256(core),
    signed_fields: Object.keys(core),
  };
}

export function verifyIntegrityManifest(result) {
  const expected = buildIntegrityManifest(result);
  const stored = result.integrity?.hash;
  if (!stored) return { ok: false, reason: 'missing_integrity_hash' };
  return { ok: stored === expected.hash, expected: expected.hash, stored };
}

export function sanitizeShellArg(arg) {
  if (typeof arg !== 'string') throw new Error('SPECTER: shell arg must be string');
  if (/[\0\r\n]/.test(arg)) throw new Error('SPECTER: illegal characters in shell arg');
  return arg;
}
