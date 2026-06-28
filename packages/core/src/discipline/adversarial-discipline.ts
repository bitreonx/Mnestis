/**
 * Devil / Angel adversarial thinking — stress-test ideas and code before shipping.
 */

export function buildAdversarialDisciplineRules(): string[] {
  return [
    '## Adversarial thinking (Devil → Angel)',
    '',
    'For non-trivial features, refactors, or bug fixes, run a **two-voice review** before finalizing:',
    '',
    '### Phase 1 — Devil (break it)',
    '',
    'Adopt the mindset of someone who **wants this to fail** and knows where products hide weakness:',
    '',
    '- **Security:** injection, auth bypass, IDOR, secrets in logs, SSRF, dependency CVEs',
    '- **Correctness:** race conditions, null paths, off-by-one, timezone/date bugs, stale cache',
    '- **UX traps:** dead ends, double submits, lost form state, accessibility gaps, mobile breakage',
    '- **Architecture:** blast radius, circular deps, god modules, missing tests on hot paths',
    '- **Operations:** no rollback, silent failures, unbounded queues, missing observability',
    '- **Product:** edge cases the happy-path demo ignores; "what if the user does the opposite?"',
    '',
    'List **concrete** findings with file/line or flow evidence — not vague worry.',
    '',
    '### Phase 2 — Angel (fix it)',
    '',
    'For **each** Devil finding, propose a proportional fix:',
    '',
    '- Prefer minimal, testable patches over rewrites',
    '- Cite Mnestis \`impact_analysis\` / \`mnestis critique\` when touching central nodes',
    '- If a finding is a false alarm, say **why** with evidence — do not dismiss silently',
    '- Rank fixes: must-fix before merge vs follow-up ticket',
    '',
    '### When to run this loop',
    '',
    '- New features, API changes, auth/payments/data paths',
    '- User asks to "brainstorm", "review", "find weaknesses", or "red team"',
    '- Before marking a large PR ready',
    '',
    'CLI helpers: \`mnestis critique\`, \`mnestis brainstorm "<topic>"\`',
    '',
  ]
}

export function buildAdversarialCursorRule(): string {
  return `---
description: Mnestis adversarial review — Devil finds threats; Angel fixes them with evidence
globs:
alwaysApply: false
---

${buildAdversarialDisciplineRules().join('\n')}
`
}

export function buildAdversarialSkillMd(): string {
  return `---
name: mnestis-adversarial
description: Devil/Angel adversarial review — stress-test code and ideas for security, UX, and architecture weaknesses then propose fixes. Use before shipping features, on brainstorm requests, or when user asks for critique/red-team.
---

# Mnestis Adversarial Review

${buildAdversarialDisciplineRules().join('\n')}
`
}

/** Markdown template agents can fill for a brainstorm session. */
export function buildBrainstormTemplate(topic: string): string {
  return `# Brainstorm: ${topic}

## Context (fill from Mnestis DNA + user ask)

- **Goal:**
- **Constraints:**
- **Domains touched:**

---

## Devil — what could go wrong?

> Think like someone who hates this idea and wants to expose every flaw.

| # | Category | Threat | Evidence / scenario | Severity |
|---|----------|--------|---------------------|----------|
| 1 |          |        |                     |          |

---

## Angel — proportional fixes

> For each Devil row, a fix — or a justified dismissal.

| # | Addresses | Fix | Effort | Must ship? |
|---|-----------|-----|--------|------------|
| 1 |           |     |        |            |

---

## Recommended path

1.
2.
3.

## Open questions for the user

-
`
}
