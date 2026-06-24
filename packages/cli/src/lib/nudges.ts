import chalk from 'chalk';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { openInBrowser } from './browser.js';

const PKG_NAME = 'mnestis';
const STAR_REPO = 'https://github.com/bitreonx/Mnestis';
const STATE_DIR = path.join(homedir(), `.${PKG_NAME}`);
const STATE_FILE = path.join(STATE_DIR, 'seen.json');

export interface NudgeState {
  firstRunShown?: boolean;
  recallMilestoneShown?: boolean;
  packMilestoneShown?: boolean;
  recallCount?: number;
  packCount?: number;
  lastNudgeSession?: string;
}

let sessionNudgeUsed = false;

function nudgeSuppressed(): boolean {
  if (process.env.CI) return true;
  if (process.env.MNESTIS_NO_NUDGE === '1' || process.env.MNESTIS_NO_NUDGE === 'true') return true;
  if (process.argv.includes('--no-nudge')) return true;
  return false;
}

async function loadState(): Promise<NudgeState> {
  try {
    if (!existsSync(STATE_FILE)) return {};
    return JSON.parse(await readFile(STATE_FILE, 'utf8')) as NudgeState;
  } catch {
    return {};
  }
}

async function saveState(state: NudgeState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function tryNudge(print: () => void): Promise<void> {
  if (nudgeSuppressed() || sessionNudgeUsed) return;
  sessionNudgeUsed = true;
  print();
}

/** First-run only: star prompt (writes ~/.mnestis/seen). */
export async function maybeFirstRunNudge(): Promise<void> {
  const state = await loadState();
  if (state.firstRunShown) return;
  await tryNudge(() => {
    console.log('');
    console.log(
      chalk.dim(`Enjoying ${PKG_NAME}? A `) +
        chalk.yellow('★') +
        chalk.dim(` helps a ton → ${STAR_REPO}`),
    );
    console.log(chalk.dim(`  (run \`${PKG_NAME} star\` to open it)`));
  });
  await saveState({ ...state, firstRunShown: true });
}

/** Increment recall counter; one-time milestone at 10 recalls. */
export async function trackRecallMilestone(): Promise<void> {
  const state = await loadState();
  const count = (state.recallCount ?? 0) + 1;
  if (state.recallMilestoneShown || count < 10) {
    await saveState({ ...state, recallCount: count });
    return;
  }
  await tryNudge(() => {
    console.log('');
    console.log(chalk.green('🎉 10 memories recalled!') + chalk.dim(' If this saved you time, drop a ★.'));
    console.log(chalk.dim(`  ${STAR_REPO}`));
  });
  await saveState({ ...state, recallCount: count, recallMilestoneShown: true });
}

/** One-time nudge after first successful pack with savings. */
export async function trackPackMilestone(savingsPct: number): Promise<void> {
  const state = await loadState();
  const count = (state.packCount ?? 0) + 1;
  if (state.packMilestoneShown || count > 1 || savingsPct < 10) {
    await saveState({ ...state, packCount: count });
    return;
  }
  await tryNudge(() => {
    console.log('');
    console.log(chalk.green('🎉 First context pack saved tokens!') + chalk.dim(' Share the screenshot — ★ helps.'));
    console.log(chalk.dim(`  ${STAR_REPO}`));
  });
  await saveState({ ...state, packCount: count, packMilestoneShown: true });
}

export function printHelpFooter(): void {
  if (nudgeSuppressed()) return;
  console.log(chalk.dim(`\n★ ${STAR_REPO}`));
}

export async function openStarRepo(): Promise<void> {
  await openInBrowser(STAR_REPO);
  console.log(chalk.dim(`Opened ${STAR_REPO}`));
}

export async function printLocalStats(): Promise<void> {
  const state = await loadState();
  console.log(chalk.bold('Local usage'));
  console.log(`  Recalls:  ${state.recallCount ?? 0}`);
  console.log(`  Packs:    ${state.packCount ?? 0}`);
  if (!nudgeSuppressed()) {
    console.log(chalk.dim(`\n★ ${STAR_REPO}  (MNESTIS_NO_NUDGE=1 to hide)`));
  }
}

export { STAR_REPO, PKG_NAME };
