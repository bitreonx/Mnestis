/**
 * CINDER — Contamination INDetectors for Evaluation Results.
 * Anti-gaming: keyword stuffing, empty shells, rubric echo without substance.
 */
import { countWords, matchKeywords, normalizeText } from './ember.mjs';

export function detectKeywordStuffing(text, keywords = []) {
  const norm = normalizeText(text);
  const words = countWords(text);
  if (words < 6) return { stuffed: false, density: 0 };

  const hits = matchKeywords(norm, keywords);
  const commaParts = text.split(',').map((s) => s.trim()).filter(Boolean);
  const listLike = commaParts.length >= 6 && commaParts.length / Math.max(words, 1) >= 0.4;
  const density = hits.length / Math.max(commaParts.length, 1);

  return {
    stuffed: listLike && density >= 0.3 && commaParts.length >= 8,
    density: Math.round(density * 100) / 100,
    hits: hits.length,
    words,
    comma_parts: commaParts.length,
  };
}

export function detectEmptyShell(text) {
  const trimmed = (text ?? '').trim();
  if (trimmed.length < 20) return { empty: true, reason: 'too_short' };
  if (/^(n\/a|unknown|not sure|idk)\.?$/i.test(trimmed)) return { empty: true, reason: 'non_answer' };
  return { empty: false };
}

export function runCinder(text, rubricKeywords = []) {
  const stuffing = detectKeywordStuffing(text, rubricKeywords);
  const shell = detectEmptyShell(text);
  const gamingDetected = stuffing.stuffed || shell.empty;

  return {
    gamingDetected,
    stuffing,
    shell,
    penalty: gamingDetected ? (shell.empty ? 40 : 25) : 0,
  };
}
