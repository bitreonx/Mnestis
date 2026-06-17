/** Format a 0–100 score as "75/100" for consistent display across the dashboard. */
export function formatScore(value: number | null | undefined, max = 100): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Math.round(value)}/${max}`
}

/** Short label for score pills: "75/100" or "—" when missing. */
export function formatScoreLabel(
  label: string,
  value: number | null | undefined,
  max = 100,
): string {
  return `${label} ${formatScore(value, max)}`
}
