export interface CompressStats {
  originalChars: number
  compressedChars: number
  originalLines: number
  compressedLines: number
  estimatedOriginalTokens: number
  estimatedCompressedTokens: number
  savingsPercent: number
  /** Lines removed by each pipeline phase (for diagnostics). */
  phaseStats?: {
    noiseStripped: number
    pathsShortened: number
    stackFramesFolded: number
    testRunsCollapsed: number
    duplicatesRemoved: number
    budgetDropped: number
  }
}

export interface CompressOptions {
  maxLines?: number
  maxLineLength?: number
  /** Drop consecutive identical lines (default true). */
  dedupeConsecutive?: boolean
  /** Collapse near-duplicate lines via normalized fingerprint (default true). */
  fuzzyDedupe?: boolean
  /** Keep errors/failures even when over budget (default true). */
  prioritizeErrors?: boolean
  /** Fold repeated stack-trace frames into summaries (default true). */
  collapseStackTraces?: boolean
  /** Replace long absolute paths with basename or relative segments (default true). */
  shortenPaths?: boolean
  /** Strip spinner/progress/timestamp noise (default true). */
  stripNoise?: boolean
}

const ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g
const OSC_RE = /\x1b\][^\x07]*(?:\x07|\x1b\\)/g
const CARRIAGE_RE = /\r/g

/** ISO / bracketed timestamps, HH:MM:SS, epoch ms. */
const TIMESTAMP_RE =
  /(?:\[\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\]|\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?|\[\d{2}:\d{2}:\d{2}(?:\.\d+)?\]|\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/g

/** npm/yarn/pnpm progress, webpack bars, vitest dots. */
const NOISE_LINE_RE =
  /^(?:[\s⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏◐◓◑◒▁▂▃▄▅▆▇█░▒▓]+|[\s\-\\|/]+(?:\s|$)|(?:npm|yarn|pnpm|vite|webpack|vitest|jest|mocha)\s+(?:WARN|info|verb)?|\d+\/\d+\s*$|(?:\d{1,3}%)|(?:\.{3,}\s*$)|(?:Building|Compiling|Bundling|Optimizing)\.{0,3}\s*$)/i

const SPINNER_ONLY_RE = /^[\s⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏◐◓◑◒▁▂▃▄▅▆▇█░▒▓\-\\|/]+$/

const STACK_FRAME_RE =
  /^\s*(?:at\s+|→\s*)?(?:async\s+)?(?:.*?\s+\()?(?:file:\/\/)?(?:\/?[\w.~-]+(?:[/\\][\w.~-]+)*\.(?:tsx?|jsx?|mjs|cjs|vue|svelte|py|go|rs|java|rb|php))(?::\d+:\d+|\:\d+)?\)?\s*$/

const ERROR_SIGNAL_RE =
  /\b(?:error|err|fail(?:ed|ure)?|exception|fatal|panic|assert(?:ion)?|✗|✘|×|FAIL|Error:|TypeError|ReferenceError|SyntaxError)\b/i

const WARN_SIGNAL_RE = /\b(?:warn(?:ing)?|deprecated|⚠)\b/i

const PASS_SIGNAL_RE = /\b(?:pass(?:ed|es)?|✓|✔|ok\b|success)\b/i

const ABS_PATH_RE =
  /(?:[A-Za-z]:\\(?:[\w.~-]+\\)+[\w.~-]+|\/(?:Users|home|tmp|var|opt|workspace|mnt|Volumes|projects|dev|src|code)(?:\/[\w.~-]+)+\.(?:tsx?|jsx?|mjs|cjs|vue|svelte|py|go|rs|java|rb|php))/g

const HOME_TILDE_RE = /(?:~\/[\w.~-]+(?:\/[\w.~-]+)*)/g

type ScoredLine = {
  text: string
  score: number
  fingerprint: string
  index: number
  isStack: boolean
}

/** Hybrid token estimate: closer to tiktoken on mixed code/log output. */
export function estimateTokens(text: string): number {
  if (!text) return 0
  const words = text.match(/[\p{L}\p{N}_]+/gu)?.length ?? 0
  const symbolChars = (text.match(/[^\p{L}\p{N}_\s]/gu) ?? []).length
  const whitespaceSplits = text.split(/\s+/).filter(Boolean).length
  return Math.max(
    1,
    Math.ceil(words * 1.15 + symbolChars * 0.55 + whitespaceSplits * 0.12),
  )
}

function collapseWhitespace(line: string): string {
  return line.replace(/\s+/g, ' ').trim()
}

function normalizeRaw(raw: string): string {
  return raw.replace(OSC_RE, '').replace(ANSI_RE, '').replace(CARRIAGE_RE, '')
}

function stripTimestamps(line: string): string {
  return line.replace(TIMESTAMP_RE, '').replace(/\s{2,}/g, ' ').trim()
}

function shortenPathsInLine(line: string): { line: string; changed: boolean } {
  let changed = false
  const shortened = line
    .replace(ABS_PATH_RE, (match) => {
      changed = true
      const parts = match.replace(/\\/g, '/').split('/')
      const file = parts.at(-1) ?? match
      const parent = parts.at(-2)
      return parent ? `${parent}/${file}` : file
    })
    .replace(HOME_TILDE_RE, (match) => {
      changed = true
      const parts = match.split('/')
      return parts.at(-1) ?? match
    })
  return { line: shortened, changed }
}

function lineFingerprint(line: string): string {
  return line
    .toLowerCase()
    .replace(/\d+/g, '#')
    .replace(/0x[0-9a-f]+/gi, '0x#')
    .replace(/['"`][^'"`]*['"`]/g, '""')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreLine(line: string): number {
  if (ERROR_SIGNAL_RE.test(line)) return 100
  if (WARN_SIGNAL_RE.test(line)) return 70
  if (PASS_SIGNAL_RE.test(line)) return 40
  if (STACK_FRAME_RE.test(line)) return 15
  if (/^\s*#+\s/.test(line)) return 55
  if (/^\s*[-*]\s/.test(line)) return 35
  if (/^\s*\d+\.\s/.test(line)) return 35
  return 25
}

function isNoiseLine(line: string): boolean {
  if (!line) return true
  if (SPINNER_ONLY_RE.test(line)) return true
  if (NOISE_LINE_RE.test(line)) return true
  if (/^[\s\-=]{8,}$/.test(line)) return true
  return false
}

function foldStackTraces(lines: ScoredLine[]): { lines: ScoredLine[]; folded: number } {
  const out: ScoredLine[] = []
  let folded = 0
  let i = 0

  while (i < lines.length) {
    const current = lines[i]
    if (!current.isStack) {
      out.push(current)
      i += 1
      continue
    }

    const run: ScoredLine[] = [current]
    let j = i + 1
    while (j < lines.length && lines[j].isStack) {
      run.push(lines[j])
      j += 1
    }

    if (run.length >= 4) {
      const head = run.slice(0, 2)
      const tail = run.at(-1)!
      const skipped = run.length - 3
      folded += skipped
      out.push(...head)
      out.push({
        text: `  … ${skipped} more stack frame${skipped === 1 ? '' : 's'} …`,
        score: 20,
        fingerprint: `stack-fold-${skipped}`,
        index: tail.index,
        isStack: false,
      })
      out.push(tail)
    } else {
      out.push(...run)
    }

    i = j
  }

  return { lines: out, folded }
}

function dedupeLines(lines: ScoredLine[], fuzzy: boolean): { lines: ScoredLine[]; removed: number } {
  const out: ScoredLine[] = []
  const seenExact = new Set<string>()
  const seenFuzzy = new Set<string>()
  let removed = 0
  let prevExact = ''

  for (const line of lines) {
    if (line.text === prevExact) {
      removed += 1
      continue
    }

    if (seenExact.has(line.text)) {
      removed += 1
      continue
    }

    if (fuzzy && seenFuzzy.has(line.fingerprint) && line.score < 80) {
      removed += 1
      continue
    }

    out.push(line)
    seenExact.add(line.text)
    seenFuzzy.add(line.fingerprint)
    prevExact = line.text
  }

  return { lines: out, removed }
}

function applyBudget(lines: ScoredLine[], maxLines: number, prioritizeErrors: boolean): { lines: ScoredLine[]; dropped: number } {
  if (lines.length <= maxLines) return { lines, dropped: 0 }

  if (!prioritizeErrors) {
    return { lines: lines.slice(0, maxLines), dropped: lines.length - maxLines }
  }

  const mustKeep = new Set<number>()
  for (const line of lines) {
    if (line.score >= 70) mustKeep.add(line.index)
  }

  const selected: ScoredLine[] = []
  const used = new Set<number>()

  for (const line of lines) {
    if (!mustKeep.has(line.index)) continue
    selected.push(line)
    used.add(line.index)
    if (selected.length >= maxLines) break
  }

  for (const line of lines) {
    if (selected.length >= maxLines) break
    if (used.has(line.index)) continue
    selected.push(line)
    used.add(line.index)
  }

  selected.sort((a, b) => a.index - b.index)
  return { lines: selected, dropped: lines.length - selected.length }
}

function truncateLine(line: string, maxLineLength: number): string {
  if (line.length <= maxLineLength) return line
  return `${line.slice(0, maxLineLength - 1)}…`
}

/** Collapse long runs of identical pass/fail test lines into a summary. */
function collapseTestRuns(lines: ScoredLine[]): { lines: ScoredLine[]; collapsed: number } {
  const out: ScoredLine[] = []
  let collapsed = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    const isPass = PASS_SIGNAL_RE.test(line.text) && !ERROR_SIGNAL_RE.test(line.text)
    const isFail = ERROR_SIGNAL_RE.test(line.text)

    if (!isPass && !isFail) {
      out.push(line)
      i += 1
      continue
    }

    const kind = isPass ? 'pass' : 'fail'
    const run: ScoredLine[] = [line]
    let j = i + 1
    while (j < lines.length) {
      const next = lines[j]!
      const nextPass = PASS_SIGNAL_RE.test(next.text) && !ERROR_SIGNAL_RE.test(next.text)
      const nextFail = ERROR_SIGNAL_RE.test(next.text)
      if ((kind === 'pass' && nextPass) || (kind === 'fail' && nextFail)) {
        run.push(next)
        j += 1
      } else {
        break
      }
    }

    if (run.length >= 5) {
      collapsed += run.length - 2
      out.push(run[0]!)
      out.push({
        text: `  … ${run.length - 2} more ${kind} line${run.length - 2 === 1 ? '' : 's'} …`,
        score: kind === 'fail' ? 90 : 35,
        fingerprint: `test-${kind}-run-${run.length}`,
        index: run.at(-1)!.index,
        isStack: false,
      })
      out.push(run.at(-1)!)
    } else {
      out.push(...run)
    }

    i = j
  }

  return { lines: out, collapsed }
}

/**
 * Multi-pass, importance-weighted output compression for agent-facing command results.
 *
 * Pipeline: normalize → denoise → path shorten → score → stack fold → dedupe → budget → truncate.
 */
export function compressCommandOutput(
  raw: string,
  options: CompressOptions = {},
): { text: string; stats: CompressStats } {
  const maxLines = options.maxLines ?? 120
  const maxLineLength = options.maxLineLength ?? 240
  const dedupe = options.dedupeConsecutive !== false
  const fuzzyDedupe = options.fuzzyDedupe !== false
  const prioritizeErrors = options.prioritizeErrors !== false
  const collapseStackTraces = options.collapseStackTraces !== false
  const shortenPaths = options.shortenPaths !== false
  const stripNoise = options.stripNoise !== false

  const stripped = normalizeRaw(raw)
  const rawLines = stripped.split(/\n/)
  const phaseStats = {
    noiseStripped: 0,
    pathsShortened: 0,
    stackFramesFolded: 0,
    testRunsCollapsed: 0,
    duplicatesRemoved: 0,
    budgetDropped: 0,
  }

  const scored: ScoredLine[] = []

  for (let index = 0; index < rawLines.length; index += 1) {
    let line = collapseWhitespace(rawLines[index] ?? '')
    if (!line) continue

    if (stripNoise) {
      line = stripTimestamps(line)
      if (isNoiseLine(line)) {
        phaseStats.noiseStripped += 1
        continue
      }
    }

    if (shortenPaths) {
      const { line: shortened, changed } = shortenPathsInLine(line)
      line = shortened
      if (changed) phaseStats.pathsShortened += 1
    }

    const isStack = STACK_FRAME_RE.test(line)
    scored.push({
      text: line,
      score: scoreLine(line),
      fingerprint: lineFingerprint(line),
      index,
      isStack,
    })
  }

  let working = scored

  if (collapseStackTraces) {
    const folded = foldStackTraces(working)
    working = folded.lines
    phaseStats.stackFramesFolded = folded.folded
  }

  {
    const collapsed = collapseTestRuns(working)
    working = collapsed.lines
    phaseStats.testRunsCollapsed = collapsed.collapsed
  }

  if (dedupe || fuzzyDedupe) {
    const deduped = dedupeLines(working, fuzzyDedupe)
    working = deduped.lines
    phaseStats.duplicatesRemoved = deduped.removed
  }

  const budgeted = applyBudget(working, maxLines, prioritizeErrors)
  working = budgeted.lines
  phaseStats.budgetDropped = budgeted.dropped

  const out = working.map((l) => truncateLine(l.text, maxLineLength))
  const compressed = out.join('\n')

  const estimatedOriginalTokens = estimateTokens(stripped)
  const estimatedCompressedTokens = estimateTokens(compressed)
  const savingsPercent =
    estimatedOriginalTokens > 0
      ? Math.round((1 - estimatedCompressedTokens / estimatedOriginalTokens) * 100)
      : 0

  return {
    text: compressed,
    stats: {
      originalChars: stripped.length,
      compressedChars: compressed.length,
      originalLines: rawLines.length,
      compressedLines: out.length,
      estimatedOriginalTokens,
      estimatedCompressedTokens,
      savingsPercent,
      phaseStats,
    },
  }
}
