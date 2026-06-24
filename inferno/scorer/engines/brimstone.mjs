/**
 * BRIMSTONE — Binary Rubric for Impact & Module Scoring Trap Enumeration.
 * Adversarial traps: forbidden concepts, prompt injection, homoglyph spoofing.
 */
import { normalizeText } from './ember.mjs';

export const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(the\s+)?(rubric|ground\s*truth|benchmark)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /<\s*script[\s>]/i,
  /\$\{.*\}/,
  /;\s*rm\s+-rf/i,
  /`\s*curl\s+/i,
];

export const HOMOGLYPH_MAP = {
  '\u0430': 'a',
  '\u0435': 'e',
  '\u043e': 'o',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0443': 'y',
  '\u0456': 'i',
};

export function dehomoglyph(text) {
  let out = text ?? '';
  for (const [fake, real] of Object.entries(HOMOGLYPH_MAP)) {
    out = out.replaceAll(fake, real);
  }
  return out;
}

export function detectInjection(text) {
  const hits = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text ?? '')) hits.push(pattern.source.slice(0, 40));
  }
  return hits;
}

export function detectForbidden(normText, forbidden = []) {
  const hits = [];
  for (const term of forbidden) {
    if (normText.includes(term.toLowerCase())) hits.push(term);
  }
  return hits;
}

export function runBrimstone(text, forbidden = []) {
  const raw = text ?? '';
  const sanitized = dehomoglyph(raw);
  const norm = normalizeText(sanitized);
  const injectionHits = detectInjection(raw);
  const forbiddenHits = detectForbidden(norm, forbidden);
  const trapTriggered = injectionHits.length > 0 || forbiddenHits.length > 0;

  return {
    trapTriggered,
    injectionHits,
    forbiddenHits,
    sanitized,
    norm,
    penalty: trapTriggered
      ? Math.min(50, injectionHits.length * 25 + forbiddenHits.length * 15)
      : 0,
  };
}
