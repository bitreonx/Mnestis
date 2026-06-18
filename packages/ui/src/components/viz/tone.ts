/**
 * Shared tone scale for data-viz. A 0–100 score maps to one of five tones, each
 * resolved to a token-backed color so charts re-theme automatically. Mirrors the
 * thresholds the old HealthRing used so existing visuals don't shift.
 */

export type Tone = 'good' | 'ok' | 'warn' | 'bad' | 'neutral'

export const toneForScore = (score: number): Tone => {
  if (Number.isNaN(score)) return 'neutral'
  if (score >= 80) return 'good'
  if (score >= 60) return 'ok'
  if (score >= 40) return 'warn'
  return 'bad'
}

/** CSS var reference for a tone's primary color. */
export const toneColor = (tone: Tone): string => {
  switch (tone) {
    case 'good':
      return 'var(--color-success)'
    case 'ok':
      return 'var(--color-accent)'
    case 'warn':
      return 'var(--color-warn)'
    case 'bad':
      return 'var(--color-danger)'
    default:
      return 'var(--color-muted)'
  }
}

export const toneColorForScore = (score: number): string => toneColor(toneForScore(score))

/** Categorical palette accessor — cycles through the 8 viz-cat tokens. */
export const categoricalColor = (index: number): string =>
  `var(--color-viz-cat-${(index % 8) + 1})`
