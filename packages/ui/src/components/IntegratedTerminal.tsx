import { useEffect, useMemo, useRef, useState } from 'react';

interface IntegratedTerminalProps {
  repoId: string;
  repositoryPath: string;
  outputFilter?: string;
  compact?: boolean;
  /** Starting mode (e.g. synced to the active cockpit). Stored prefs win if present. */
  initialMode?: TerminalMode;
}

export type TerminalMode = 'vibe' | 'ai' | 'coder';

interface TerminalBlock {
  id: number;
  kind: 'input' | 'output' | 'error' | 'system' | 'info';
  content: string;
  /** Original command, used for "copy for AI" affordances. */
  command?: string;
  durationMs?: number;
  ts?: number;
  mode?: TerminalMode;
}

interface CommandSpec {
  name: string;
  usage: string;
  desc: string;
  category: 'analyze' | 'ai' | 'explore' | 'meta';
  example?: string;
  /** Modes where this command is surfaced first. */
  featured?: TerminalMode[];
}

/** Server-backed commands (must stay in sync with vite.workspace.ts ALLOWED_CLI). */
const COMMANDS: CommandSpec[] = [
  { name: 'ask', usage: 'ask "<question>"', desc: 'Architecture copilot — ask anything in plain English', category: 'ai', example: 'ask "how does auth work?"', featured: ['vibe', 'ai'] },
  { name: 'explain', usage: 'explain', desc: 'Plain-language description of what this repo does', category: 'explore', featured: ['vibe'] },
  { name: 'story', usage: 'story', desc: 'Architecture narrative — layers, domains, risks', category: 'explore', featured: ['vibe'] },
  { name: 'score', usage: 'score', desc: 'Repository health score breakdown', category: 'analyze', featured: ['vibe', 'coder'] },
  { name: 'dna', usage: 'dna', desc: 'Project DNA — one-glance summary for humans + AI', category: 'ai', featured: ['ai', 'vibe'] },
  { name: 'flows', usage: 'flows [query]', desc: 'List or search execution flows', category: 'explore', featured: ['coder'] },
  { name: 'impact', usage: 'impact <node>', desc: 'Blast radius of changing a file or node', category: 'analyze', example: 'impact auth.service', featured: ['coder'] },
  { name: 'inspect', usage: 'inspect <query>', desc: 'Inspect a domain, service, or node', category: 'explore', featured: ['coder'] },
  { name: 'query', usage: 'query "<question>"', desc: 'Graph-aware query with traversal output', category: 'explore', example: 'query "where is auth validated?"', featured: ['coder'] },
  { name: 'path', usage: 'path <from> <to>', desc: 'Shortest path between two nodes in the graph', category: 'explore', example: 'path login dashboard', featured: ['coder'] },
  { name: 'onboard', usage: 'onboard', desc: 'New-developer onboarding guide', category: 'explore', featured: ['vibe', 'coder'] },
  { name: 'context', usage: 'context', desc: 'Build/export the AI context protocol package', category: 'ai', featured: ['ai'] },
  { name: 'pack', usage: 'pack [--section=summary]', desc: 'Print AI Pack v1 (JSON) — paste straight into Claude/Cursor', category: 'ai', example: 'pack --section=summary', featured: ['ai'] },
  { name: 'prompt', usage: 'prompt [--claude]', desc: 'Copy-paste starter prompt loaded with repo context', category: 'ai', featured: ['ai'] },
  { name: 'focus', usage: 'focus "<task>"', desc: 'Minimal, token-budgeted context pack for one edit', category: 'ai', example: 'focus "add rate limiting"', featured: ['ai'] },
  { name: 'hotspots', usage: 'hotspots', desc: 'Git churn hotspots mapped to architecture', category: 'analyze', featured: ['coder'] },
  { name: 'diff', usage: 'diff', desc: 'DNA structural diff since last build (regression guard)', category: 'analyze', featured: ['coder'] },
  { name: 'build', usage: 'build', desc: 'Re-analyze the repository and refresh memory', category: 'analyze', featured: ['vibe', 'ai', 'coder'] },
];

/** Client-only meta commands handled without hitting the server. */
const META_COMMANDS = ['help', 'clear', 'cls', 'mode', 'history', 'modes', 'welcome'] as const;

const COMMAND_NAMES = new Set(COMMANDS.map((c) => c.name));
const ALL_KNOWN = new Set<string>([...COMMAND_NAMES, ...META_COMMANDS]);

interface ModeConfig {
  label: string;
  icon: string;
  accent: string;
  tagline: string;
  placeholder: string;
  chips: { label: string; run: string }[];
  welcome: string[];
  /** vibe routes unknown free-text to the copilot. */
  naturalLanguage: boolean;
}

const MODE_CONFIG: Record<TerminalMode, ModeConfig> = {
  vibe: {
    label: 'Vibe',
    icon: '✦',
    accent: '#a78bfa',
    tagline: 'ask anything, plain English',
    placeholder: 'Ask anything… "what does this repo do?"  or  type a command',
    naturalLanguage: true,
    chips: [
      { label: 'What does this do?', run: 'ask "what does this repository do in one paragraph?"' },
      { label: 'Big picture', run: 'story' },
      { label: 'Is it healthy?', run: 'score' },
      { label: 'Main flows', run: 'flows' },
      { label: 'Explain simply', run: 'explain' },
      { label: 'Where do I start?', run: 'onboard' },
    ],
    welcome: [
      'Vibe mode — talk to your codebase like a person.',
      'Just type a question and press Enter. No commands to memorize.',
      'Try a chip below, or ask "how does auth work?"',
    ],
  },
  ai: {
    label: 'AI',
    icon: '⚇',
    accent: '#38bdf8',
    tagline: 'agent-ready context for Claude / Cursor',
    placeholder: 'pack · prompt · focus "task" · dna   — context built for AI agents',
    naturalLanguage: false,
    chips: [
      { label: 'Copy AI Pack', run: 'pack --section=summary' },
      { label: 'Starter prompt', run: 'prompt' },
      { label: 'Project DNA', run: 'dna' },
      { label: 'Focus pack', run: 'focus "add a feature"' },
      { label: 'Context docs', run: 'context' },
    ],
    welcome: [
      'AI mode — everything an agent needs, copy-ready.',
      'Output blocks get a "Copy for AI" button. Feed them to Claude or Cursor.',
      'Start with `pack --section=summary` or `focus "your task"`.',
    ],
  },
  coder: {
    label: 'Coder',
    icon: '⌘',
    accent: '#34d399',
    tagline: 'full CLI, autocomplete, power tools',
    placeholder: 'score · flows · impact <node> · query "…" · hotspots   (Tab to complete)',
    naturalLanguage: false,
    chips: [
      { label: 'Health score', run: 'score' },
      { label: 'Hotspots', run: 'hotspots' },
      { label: 'Regression diff', run: 'diff' },
      { label: 'Query graph', run: 'query "where is auth validated?"' },
      { label: 'Flows', run: 'flows' },
    ],
    welcome: [
      'Coder mode — the full Mnemos CLI, in the browser.',
      'Tab completes commands · ↑/↓ history · Ctrl+L clears.',
      'Type `help` for every command.',
    ],
  },
};

const MODES: TerminalMode[] = ['vibe', 'ai', 'coder'];

function tokenize(raw: string): string[] {
  return raw.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((p) => p.replace(/^"|"$/g, '')) ?? [];
}

function modeStorageKey(repoId: string) {
  return `mnemos.terminal.mode.${repoId}`;
}
function historyStorageKey(repoId: string) {
  return `mnemos.terminal.history.${repoId}`;
}

let blockSeq = 0;
const nextId = () => ++blockSeq;

export function IntegratedTerminal({ repoId, repositoryPath, outputFilter = '', compact = false, initialMode }: IntegratedTerminalProps) {
  const [mode, setMode] = useState<TerminalMode>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(modeStorageKey(repoId)) : null;
    if ((stored as TerminalMode) && MODES.includes(stored as TerminalMode)) return stored as TerminalMode;
    if (initialMode && MODES.includes(initialMode)) return initialMode;
    return 'vibe';
  });
  const [blocks, setBlocks] = useState<TerminalBlock[]>(() => welcomeBlocks(mode, repositoryPath));
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(historyStorageKey(repoId)) : null;
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [acIndex, setAcIndex] = useState(0);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = MODE_CONFIG[mode];

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [blocks]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(modeStorageKey(repoId), mode);
    } catch {
      /* ignore */
    }
  }, [mode, repoId]);

  // Autocomplete candidates from the first token being typed.
  const autocomplete = useMemo(() => {
    const trimmed = currentInput.trimStart();
    if (!trimmed || /\s/.test(trimmed)) return [];
    const lower = trimmed.toLowerCase();
    const featured = (c: CommandSpec) => (c.featured?.includes(mode) ? 0 : 1);
    return COMMANDS.filter((c) => c.name.startsWith(lower) && c.name !== lower)
      .sort((a, b) => featured(a) - featured(b) || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [currentInput, mode]);

  useEffect(() => setAcIndex(0), [currentInput]);

  function pushBlocks(...items: Omit<TerminalBlock, 'id'>[]) {
    setBlocks((prev) => [...prev, ...items.map((b) => ({ ...b, id: nextId() }))]);
  }

  function switchMode(next: TerminalMode) {
    if (next === mode) return;
    setMode(next);
    setBlocks((prev) => [
      ...prev,
      { id: nextId(), kind: 'system', content: `— switched to ${MODE_CONFIG[next].label} mode · ${MODE_CONFIG[next].tagline} —` },
    ]);
  }

  function persistHistory(next: string[]) {
    try {
      localStorage.setItem(historyStorageKey(repoId), JSON.stringify(next.slice(-100)));
    } catch {
      /* ignore */
    }
  }

  function renderHelp(): string {
    const featured = COMMANDS.filter((c) => c.featured?.includes(mode));
    const rest = COMMANDS.filter((c) => !c.featured?.includes(mode));
    const fmt = (c: CommandSpec) => `  ${c.usage.padEnd(26)} ${c.desc}`;
    return [
      `Mnemos · ${config.label} mode — ${config.tagline}`,
      '',
      'Featured here:',
      ...featured.map(fmt),
      '',
      'Also available:',
      ...rest.map(fmt),
      '',
      'Built-in: help · clear · history · modes · mode <vibe|ai|coder>',
      'Keys: Tab complete · ↑/↓ history · Ctrl+L clear',
    ].join('\n');
  }

  function handleMeta(name: string, args: string[]): boolean {
    switch (name) {
      case 'clear':
      case 'cls':
        setBlocks([]);
        return true;
      case 'help':
        pushBlocks({ kind: 'info', content: renderHelp() });
        return true;
      case 'welcome':
        setBlocks(welcomeBlocks(mode, repositoryPath));
        return true;
      case 'modes':
        pushBlocks({
          kind: 'info',
          content: MODES.map((m) => `  ${MODE_CONFIG[m].icon} ${MODE_CONFIG[m].label.padEnd(6)} ${MODE_CONFIG[m].tagline}`).join('\n'),
        });
        return true;
      case 'mode': {
        const target = args[0] as TerminalMode | undefined;
        if (target && MODES.includes(target)) {
          switchMode(target);
        } else {
          pushBlocks({ kind: 'error', content: `Usage: mode <vibe|ai|coder> (current: ${mode})` });
        }
        return true;
      }
      case 'history':
        pushBlocks({
          kind: 'info',
          content: commandHistory.length
            ? commandHistory.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`).join('\n')
            : '(no history yet)',
        });
        return true;
      default:
        return false;
    }
  }

  const executeCommand = async (raw: string) => {
    const command = raw.trim();
    if (!command || running) return;

    setCommandHistory((h) => {
      const next = [...h, command];
      persistHistory(next);
      return next;
    });
    setHistoryIndex(-1);
    pushBlocks({ kind: 'input', content: command, mode });
    setCurrentInput('');

    const tokens = tokenize(command);
    const head = (tokens[0] ?? '').toLowerCase();

    // Client-side meta commands first.
    if ((META_COMMANDS as readonly string[]).includes(head)) {
      handleMeta(head, tokens.slice(1));
      return;
    }

    // Resolve what we actually send to the server.
    let toRun = command;
    if (!COMMAND_NAMES.has(head)) {
      if (config.naturalLanguage) {
        // Vibe mode: treat free text as a copilot question.
        toRun = `ask ${JSON.stringify(command)}`;
      } else {
        const guess = nearest(head);
        pushBlocks({
          kind: 'error',
          content: `Unknown command: ${head}${guess ? `\nDid you mean "${guess}"?` : ''}\nType "help" for commands${mode !== 'vibe' ? ', or switch to Vibe mode to ask in plain English.' : '.'}`,
        });
        return;
      }
    }

    setRunning(true);
    const started = performance.now();
    try {
      const result = await runWithFallback(repoId, toRun);
      const durationMs = Math.round(performance.now() - started);
      pushBlocks({
        kind: result.ok ? 'output' : 'error',
        content: result.output || '(no output)',
        command: toRun,
        durationMs,
        ts: Date.now(),
        mode,
      });
    } catch (err) {
      pushBlocks({ kind: 'error', content: err instanceof Error ? err.message : 'Command failed' });
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl+L clears, like a real shell.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setBlocks([]);
      return;
    }

    const acOpen = autocomplete.length > 0;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (acOpen) {
        setCurrentInput(autocomplete[acIndex].name + ' ');
      }
      return;
    }

    if (e.key === 'Enter') {
      if (acOpen && currentInput.trim() === autocomplete[acIndex]?.name.slice(0, currentInput.trim().length)) {
        // let it run; user pressed Enter to execute
      }
      executeCommand(currentInput);
      return;
    }

    if (e.key === 'Escape') {
      setCurrentInput('');
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (acOpen) {
        setAcIndex((i) => (i - 1 + autocomplete.length) % autocomplete.length);
        return;
      }
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (acOpen) {
        setAcIndex((i) => (i + 1) % autocomplete.length);
        return;
      }
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  async function copyBlock(block: TerminalBlock) {
    const payload =
      mode === 'ai' && block.command
        ? `# Mnemos · ${block.command}\n# Repository: ${repositoryPath}\n\n${block.content}`
        : block.content;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedId(block.id);
      setTimeout(() => setCopiedId((c) => (c === block.id ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const filter = outputFilter.trim().toLowerCase();
  const visibleBlocks = filter
    ? blocks.filter((b) => b.content.toLowerCase().includes(filter))
    : blocks;

  return (
    <div
      className={`integrated-terminal mnemos-term mnemos-term--${mode} ${compact ? 'integrated-terminal--compact' : ''}`}
      style={{ ['--term-accent' as string]: config.accent }}
    >
      <div className="mnemos-term-bar">
        <div className="mnemos-term-modes" role="tablist" aria-label="Terminal mode">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={m === mode}
              className={`mnemos-term-mode ${m === mode ? 'is-active' : ''}`}
              style={m === mode ? { ['--term-accent' as string]: MODE_CONFIG[m].accent } : undefined}
              onClick={() => switchMode(m)}
              title={MODE_CONFIG[m].tagline}
            >
              <span className="mnemos-term-mode-icon">{MODE_CONFIG[m].icon}</span>
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>
        <div className="mnemos-term-meta">
          <span className="mnemos-term-tagline">{config.tagline}</span>
          <button type="button" className="mnemos-term-iconbtn" title="Clear (Ctrl+L)" onClick={() => setBlocks([])}>
            Clear
          </button>
        </div>
      </div>

      <div className="terminal-body mnemos-term-body" ref={terminalRef}>
        {visibleBlocks.map((block) => (
          <div key={block.id} className={`mnemos-term-block mnemos-term-block--${block.kind}`}>
            {block.kind === 'input' ? (
              <div className="mnemos-term-inputline">
                <span className="mnemos-term-chevron">{MODE_CONFIG[block.mode ?? mode].icon}</span>
                <span className="mnemos-term-inputtext">{block.content}</span>
              </div>
            ) : (
              <div className="mnemos-term-outwrap">
                <pre className="mnemos-term-pre">{block.content}</pre>
                {(block.kind === 'output' || block.kind === 'error') && (
                  <div className="mnemos-term-outmeta">
                    {block.durationMs != null && <span className="mnemos-term-dur">{block.durationMs}ms</span>}
                    <button type="button" className="mnemos-term-copy" onClick={() => copyBlock(block)}>
                      {copiedId === block.id ? '✓ copied' : mode === 'ai' ? 'Copy for AI' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {running && (
          <div className="mnemos-term-block mnemos-term-block--system">
            <span className="mnemos-term-spinner" /> working…
          </div>
        )}
      </div>

      <div className="mnemos-term-chips">
        {config.chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className="mnemos-term-chip"
            disabled={running}
            onClick={() => executeCommand(chip.run)}
            title={chip.run}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mnemos-term-inputrow">
        <span className="mnemos-term-prompt" style={{ color: config.accent }}>
          {running ? '…' : config.icon}
        </span>
        <div className="mnemos-term-inputfield">
          <input
            ref={inputRef}
            type="text"
            className="terminal-input mnemos-term-input"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            aria-label={`${config.label} mode terminal input`}
            placeholder={running ? 'Running…' : config.placeholder}
            spellCheck={false}
            autoComplete="off"
          />
          {autocomplete.length > 0 && (
            <div className="mnemos-term-ac">
              {autocomplete.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className={`mnemos-term-acitem ${i === acIndex ? 'is-active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setCurrentInput(c.name + ' ');
                    inputRef.current?.focus();
                  }}
                >
                  <span className="mnemos-term-acname">{c.name}</span>
                  <span className="mnemos-term-acdesc">{c.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Run a command against the live dev server (`/api/terminal`). When that backend
 * isn't present — e.g. the static Vercel deploy — fall back to read-only handlers
 * that serve prebuilt context from the bundled `/.mnemos/` JSON instead of erroring.
 */
async function runWithFallback(repoId: string, toRun: string): Promise<{ ok: boolean; output: string }> {
  try {
    const res = await fetch('/api/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoId, command: toRun }),
    });
    const ct = res.headers.get('content-type') ?? '';
    if (res.ok && ct.includes('application/json')) {
      const data = (await res.json()) as { ok: boolean; output: string };
      return { ok: data.ok, output: data.output };
    }
    // Backend reachable but not the Mnemos API (e.g. SPA 404 HTML) → offline.
    return runOffline(repoId, toRun);
  } catch {
    return runOffline(repoId, toRun);
  }
}

function mnemosBase(repoId: string): string {
  return repoId === 'local' ? '/.mnemos' : `/.mnemos/${repoId}`;
}

async function runOffline(repoId: string, toRun: string): Promise<{ ok: boolean; output: string }> {
  const tokens = tokenize(toRun);
  const head = (tokens[0] ?? '').toLowerCase();
  const base = mnemosBase(repoId);

  const getJson = async (file: string): Promise<Record<string, unknown> | null> => {
    try {
      const r = await fetch(`${base}/${file}`);
      return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  switch (head) {
    case 'dna': {
      const dna = await getJson('project.dna.json');
      if (!dna) break;
      return { ok: true, output: JSON.stringify(dna, null, 2) };
    }
    case 'pack': {
      const dna = await getJson('project.dna.json');
      if (!dna) break;
      return {
        ok: true,
        output: `// AI Pack (offline snapshot) — paste into Claude / Cursor\n${JSON.stringify(dna, null, 2)}`,
      };
    }
    case 'score': {
      const h = await getJson('health-score.json');
      if (!h) break;
      return { ok: true, output: JSON.stringify(h, null, 2) };
    }
    case 'explain':
    case 'story': {
      const sum = await getJson('repository_summary.json');
      if (sum) return { ok: true, output: JSON.stringify(sum, null, 2) };
      break;
    }
    default:
      break;
  }

  return {
    ok: false,
    output: [
      `This is the hosted Mnemos demo — the live "${head}" command needs a local Mnemos server.`,
      '',
      'Read-only here: dna · pack · score · explain (served from the bundled snapshot).',
      'For the full interactive terminal, run it locally:',
      '',
      '  npx mnemos .          # analyze your repo',
      '  npx mnemos ui         # this dashboard, fully live',
      '  npx mnemos serve      # memory API for agents',
    ].join('\n'),
  };
}

function welcomeBlocks(mode: TerminalMode, repositoryPath: string): TerminalBlock[] {
  const cfg = MODE_CONFIG[mode];
  return [
    { id: nextId(), kind: 'system', content: `Mnemos Terminal · ${repositoryPath}` },
    ...cfg.welcome.map((line) => ({ id: nextId(), kind: 'info' as const, content: line })),
  ];
}

/** Cheap Levenshtein-ish nearest command for typo hints. */
function nearest(input: string): string | null {
  if (!input) return null;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const name of COMMAND_NAMES) {
    const score = editDistance(input, name);
    if (score < bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return bestScore <= 2 ? best : null;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}
