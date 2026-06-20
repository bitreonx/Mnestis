#!/usr/bin/env node
/**
 * ASHES — AI Submission Harness for Evaluation Scoring.
 * Score external model/tool answers against INFERNO ground truth.
 *
 * Usage:
 *   node mnemos-bench/scorer/submit.mjs express answers.json
 *
 * answers.json:
 * {
 *   "model": "gpt-4.1",
 *   "answers": {
 *     "task1_login_start": "...",
 *     "task2_impact": "...",
 *     ...
 *   }
 * }
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INFERNO_VERSION,
  DATASET_VERSION,
  scoreSubmission,
  buildIntegrityManifest,
} from './verify.mjs';
import { assertSafeRepoId, assertWithinBenchRoot } from './engines/specter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BENCH = path.resolve(__dirname, '..');

async function main() {
  const repoId = assertSafeRepoId(process.argv[2]);
  const answersPath = process.argv[3];
  if (!answersPath) {
    console.error('Usage: node mnemos-bench/scorer/submit.mjs <repo> <answers.json>');
    process.exit(1);
  }

  const resolvedAnswers = assertWithinBenchRoot(path.resolve(answersPath), BENCH);
  const submission = JSON.parse(await readFile(resolvedAnswers, 'utf-8'));
  const gtPath = assertWithinBenchRoot(
    path.join(BENCH, 'tasks', 'ground-truth', `${repoId}.json`),
    BENCH,
  );
  const groundTruth = JSON.parse(await readFile(gtPath, 'utf-8'));

  const result = scoreSubmission(submission.answers ?? submission, groundTruth);

  const report = {
    $schema: 'inferno-bench/ashes/v1',
    benchmark: 'INFERNO-bench',
    format: 'ASHES',
    inferno_version: INFERNO_VERSION,
    dataset_version: DATASET_VERSION,
    repo: repoId,
    commit_sha: groundTruth.commit_sha,
    model: submission.model ?? 'unknown',
    evaluated_at: new Date().toISOString(),
    ...result,
  };

  report.integrity = buildIntegrityManifest({
    benchmark: report.benchmark,
    repo: report.repo,
    commit_sha: report.commit_sha,
    dataset_version: report.dataset_version,
    measured_at: report.evaluated_at,
    tools: { mnemos: { accuracy: report.accuracy, verification_tier: report.verification_tier, tasks_verified: report.tasks_verified } },
  });

  await mkdir(path.join(BENCH, 'results', 'submissions'), { recursive: true });
  const out = path.join(BENCH, 'results', 'submissions', `${repoId}-${submission.model ?? 'model'}.json`);
  await writeFile(out, JSON.stringify(report, null, 2));

  console.log(`ASHES report: ${out}`);
  console.log(`  tier=${report.verification_tier} accuracy=${report.accuracy}% verified=${report.tasks_verified}/${report.tasks_total}`);
  console.log(`  integrity=${report.integrity.hash.slice(0, 16)}…`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
