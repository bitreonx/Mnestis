#!/usr/bin/env node
/**
 * Sync static Mnemos docs (LANGUAGES.md, GRAPHS.md, architecture.md) from @mnemos/core generators.
 * Run after changing language registry or graph markdown templates.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncMnemosDocs } from '../packages/core/dist/docs/sync.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { written } = await syncMnemosDocs(repoRoot);
console.log('Synced Mnemos docs:');
for (const f of written) console.log(`  ${f}`);
