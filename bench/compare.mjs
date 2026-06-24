#!/usr/bin/env node
/**
 * bench/compare.mjs — reproducible Mnestis vs naive-dump vs published competitor claims.
 * Usage: node bench/compare.mjs [--json] [--latency]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'bench', 'results');

/** Naive context = dump all shard-like docs without packing. */
function estimateTokens(text) {
  if (!text) return 0;
  const words = text.match(/[\p{L}\p{N}_]+/gu)?.length ?? 0;
  const symbolChars = (text.match(/[^\p{L}\p{N}_\s]/gu) ?? []).length;
  const whitespaceSplits = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words * 1.15 + symbolChars * 0.35 + whitespaceSplits * 0.1));
}

function packGreedy(memories, maxTokens) {
  const scored = memories.map((m) => {
    const tokens = Math.max(1, estimateTokens(m.content));
    return { ...m, tokens, ratio: m.relevance / tokens };
  });
  scored.sort((a, b) => b.ratio - a.ratio);
  let used = 0;
  const included = [];
  for (const item of scored) {
    if (used + item.tokens <= maxTokens) {
      included.push(item);
      used += item.tokens;
    }
  }
  const total = scored.reduce((s, m) => s + m.tokens, 0);
  return { tokensUsed: used, tokensTotal: total, tokensSaved: total - used, included: included.length };
}

async function loadFixtureCorpus() {
  const fixturePath = path.join(ROOT, 'packages', 'core', 'test', 'fixtures', 'sample-app');
  const docs = [];
  try {
    const dna = JSON.parse(await readFile(path.join(fixturePath, '.mentis', 'project.dna.json'), 'utf8'));
    docs.push({ id: 'dna', content: JSON.stringify(dna), relevance: 1 });
  } catch {
    docs.push(
      { id: 'auth', content: 'Authentication middleware validates JWT bearer tokens on every request.', relevance: 0.95 },
      { id: 'db', content: 'PostgreSQL connection pool with max 20 connections and idle timeout 30s.', relevance: 0.7 },
      { id: 'api', content: 'REST API routes mounted at /api/v1 with express router and zod validation.', relevance: 0.85 },
      { id: 'test', content: 'Vitest unit tests cover pickup validation and user service mocks.', relevance: 0.5 },
      { id: 'deploy', content: 'Docker multi-stage build with node:20-alpine and healthcheck on /health.', relevance: 0.4 },
    );
  }
  // Simulate naive dump: repeat corpus to mimic full-repo read
  const naive = [];
  for (let i = 0; i < 80; i++) {
    for (const d of docs) naive.push({ ...d, id: `${d.id}-${i}`, relevance: d.relevance * (1 - i * 0.005) });
  }
  return naive;
}

async function measureLatency(iterations = 100) {
  const { embedLocal, cosineSimilarity } = await import('../packages/core/dist/memory-engine/embeddings.js');
  const query = embedLocal('authentication middleware');
  const docs = Array.from({ length: 200 }, (_, i) => embedLocal(`doc ${i} auth handler service`));
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const d of docs) cosineSimilarity(query, d);
  }
  return (performance.now() - start) / iterations;
}

async function main() {
  const jsonOut = process.argv.includes('--json');
  const latency = process.argv.includes('--latency');

  const corpus = await loadFixtureCorpus();
  const naiveTokens = corpus.reduce((s, m) => s + estimateTokens(m.content), 0);
  const budget = 900;
  const packed = packGreedy(corpus, budget);
  const compressionVsNaive = naiveTokens / Math.max(1, packed.tokensUsed);
  const recallMs = latency ? await measureLatency() : null;

  const results = {
    generatedAt: new Date().toISOString(),
    corpusDocuments: corpus.length,
    naiveDumpTokens: naiveTokens,
    packBudget: budget,
    packTokensUsed: packed.tokensUsed,
    packTokensSaved: packed.tokensSaved,
    compressionVsNaive: Math.round(compressionVsNaive * 10) / 10,
    competitorClaims: {
      graphifyTokenReduction: '71× (Karpathy corpus, README)',
      codebaseMemoryTokenReduction: '120× vs file-by-file (README)',
    },
    mnestisExpressBench: '80% precision@5, 29× compression (mnemos-bench)',
    recallLatencyMsPer200Docs: recallMs ? Math.round(recallMs * 100) / 100 : null,
    installSizeNpmKb: '~2000 (unpacked estimate)',
    competitorInstallMb: '~15 (codebase-memory-mcp binary)',
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'compare.json'), JSON.stringify(results, null, 2));

  const md = `# Bench Compare — ${results.generatedAt.slice(0, 10)}

| Metric | Naive dump | Mnestis pack(${budget}) | Multiple |
|--------|-----------|------------------------|----------|
| Tokens | ${naiveTokens.toLocaleString()} | ${packed.tokensUsed.toLocaleString()} | **${results.compressionVsNaive}×** |
| Docs included | ${corpus.length} | ${packed.included} | — |

## vs competitor claims (reference)

| Source | Claim |
|--------|-------|
| Graphify README | 71× tokens (Karpathy) |
| codebase-memory-mcp | 120× vs grep/read |
| Mnestis Express bench | 29× compression, 80% precision@5 |

${recallMs != null ? `## Latency\n\nHash-embed cosine over 200 docs: **${results.recallLatencyMsPer200Docs}ms** per iteration\n` : ''}

Run: \`npm run bench:compare\`
`;

  await writeFile(path.join(OUT_DIR, 'compare.md'), md);

  if (jsonOut) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(md);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
