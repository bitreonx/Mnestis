#!/usr/bin/env node
/**
 * Sync static MNESTIS docs (LANGUAGES.md, GRAPHS.md, architecture.md) from @mnestis/core generators.
 * Run after changing language registry or graph markdown templates.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncMNESTISDocs } from '../packages/core/dist/docs/sync.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { written } = await syncMNESTISDocs(repoRoot);
console.log('Synced MNESTIS docs:');
for (const f of written) console.log(`  ${f}`);
