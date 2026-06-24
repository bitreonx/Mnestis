#!/usr/bin/env node
/**
 * CERBERUS — triple-headed verification runner.
 * 1. EMBER/BRIMSTONE/CINDER harness tests
 * 2. Independent ground-truth grep (if fixtures present)
 * 3. Regression gate on committed results
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BENCH = path.resolve(__dirname, '..');
const ROOT = path.resolve(BENCH, '..');

function run(label, cmd, args) {
  console.log(`\n━━━ CERBERUS head: ${label} ━━━`);
  const r = spawnSync(cmd, args, { encoding: 'utf-8', cwd: ROOT, shell: true });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status === 0;
}

let failed = false;

if (!run('EMBER harness unit tests', 'node', ['MNESTIS-bench/scorer/verify.test.mjs'])) failed = true;

for (const repo of ['express', 'nestjs']) {
  const repoPath = path.join(BENCH, 'repos', repo);
  if (!existsSync(repoPath)) {
    console.log(`\n⏭  CERBERUS grep head: ${repo} fixture not cloned — skip`);
    continue;
  }
  if (!run(`Independent grep (${repo})`, 'node', ['MNESTIS-bench/scripts/verify-ground-truth.mjs', repo])) {
    failed = true;
  }
}

if (!run('Regression gate', 'node', ['MNESTIS-bench/scorer/regression.mjs'])) failed = true;

console.log(failed ? '\n✗ CERBERUS: one or more heads failed' : '\n✓ CERBERUS: all heads passed');
process.exit(failed ? 1 : 0);
