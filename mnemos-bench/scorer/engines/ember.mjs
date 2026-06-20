/**
 * EMBER — Exact Match Engine for Repository evaluation.
 * Word-boundary matching, phrase detection, path normalization.
 */
export function normalizeText(text) {
  return (text ?? '')
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/\\/g, '/')
    .normalize('NFKC');
}

const SYNONYM_CLUSTERS = {
  auth: ['authentication', 'authorize', 'login', 'signin', 'sign-in'],
  di: ['dependency injection', 'dependency-injection', 'injectable', 'di'],
  api: ['endpoint', 'rest', 'graphql', 'route'],
  impact: ['blast', 'radius', 'dependents', 'affected', 'breaks'],
};

export function expandKeyword(keyword) {
  const k = keyword.toLowerCase();
  const variants = new Set([k]);
  for (const [, cluster] of Object.entries(SYNONYM_CLUSTERS)) {
    if (cluster.some((c) => k.includes(c) || c.includes(k))) {
      cluster.forEach((c) => variants.add(c));
    }
  }
  return [...variants];
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Classify keyword → boundary | phrase | path */
export function matchMode(keyword) {
  const k = keyword.toLowerCase();
  if (k.includes('/') || k.includes('.js') || k.includes('.ts')) return 'path';
  if (k.includes(' ')) return 'phrase';
  return 'boundary';
}

export function matchKeyword(normText, keyword) {
  const mode = matchMode(keyword);
  const variants = expandKeyword(keyword);

  for (const variant of variants) {
    if (mode === 'path') {
      const needle = variant.replace(/\\/g, '/');
      if (normText.includes(needle)) return { hit: true, variant, mode };
      continue;
    }
    if (mode === 'phrase') {
      if (normText.includes(variant)) return { hit: true, variant, mode };
      continue;
    }
    const re = new RegExp(`\\b${escapeRegex(variant)}\\b`, 'i');
    if (re.test(normText)) return { hit: true, variant, mode };
  }
  return { hit: false, variant: keyword, mode };
}

export function matchKeywords(normText, keywords = []) {
  const hits = [];
  for (const k of keywords) {
    const m = matchKeyword(normText, k);
    if (m.hit) hits.push(k);
  }
  return hits;
}

export function matchPaths(normText, paths = []) {
  return paths.filter((p) => normText.includes(p.toLowerCase().replace(/\\/g, '/')));
}

export function countWords(text) {
  return (text ?? '').trim().split(/\s+/).filter(Boolean).length;
}
