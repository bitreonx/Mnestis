/**
 * Minified JSON for agent exports — smaller on disk and fewer tokens when ingested.
 */
export function compactJson(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Trim redundant whitespace from generated markdown context files.
 */
export function compactMarkdown(md: string): string {
  return md
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n';
}
