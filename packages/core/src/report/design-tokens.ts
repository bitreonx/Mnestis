/**
 * Report design tokens — single source of truth aligned with
 * packages/ui/src/styles/tokens.css (dashboard at localhost:5173).
 */

export const REPORT_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

/** Dashboard-aligned CSS custom properties + report component styles. */
export const REPORT_CSS = `
  :root {
    color-scheme: light dark;
    --font-sans: "Inter", system-ui, -apple-system, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;
    --radius-xs: 8px;
    --radius-sm: 12px;
    --radius-md: 16px;
    --radius-lg: 20px;
    --radius-xl: 28px;
    --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
    --color-bg: #fafafa;
    --color-surface: #ffffff;
    --color-surface-2: #f5f5f5;
    --color-surface-raised: #eeeeee;
    --color-border: #e5e5e5;
    --color-border-subtle: #f0f0f0;
    --color-muted: #737373;
    --color-fg: #171717;
    --color-fg-muted: #525252;
    --color-accent: #059669;
    --color-accent-hover: #047857;
    --color-success: #22c55e;
    --color-warn: #f59e0b;
    --color-danger: #ef4444;
    --color-info: #3b82f6;
    --cockpit-good: #22c55e;
    --cockpit-ok: #3ecf8e;
    --cockpit-warn: #f59e0b;
    --cockpit-bad: #ef4444;
    --shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
    --bg: var(--color-bg);
    --surface: var(--color-surface);
    --surface-2: var(--color-surface-2);
    --border: var(--color-border);
    --border-strong: #d4d4d4;
    --text: var(--color-fg);
    --text-2: var(--color-fg-muted);
    --text-3: var(--color-muted);
    --accent: var(--color-accent);
    --accent-2: var(--color-accent-hover);
    --good: var(--color-success);
    --warn: var(--color-warn);
    --bad: var(--color-danger);
    --radius: var(--radius-md);
    --sans: var(--font-sans);
    --mono: var(--font-mono);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #0a0a0a;
      --color-surface: #171717;
      --color-surface-2: #1c1c1e;
      --color-surface-raised: #262626;
      --color-border: #2e2e2e;
      --color-border-subtle: #232323;
      --color-fg: #fafafa;
      --color-fg-muted: #a3a3a3;
      --color-accent: #3ecf8e;
      --color-accent-hover: #2dd47b;
      --border-strong: #404040;
    }
    .health-ring-track { stroke: rgba(255,255,255,0.08); }
    .health-ring-center strong {
      background: linear-gradient(180deg, #ffffff, #c5ccd3);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }
  @media (prefers-color-scheme: light) {
    .health-ring-track { stroke: rgba(15, 23, 42, 0.08); }
    .health-ring-center strong { color: var(--color-fg); background: none; }
  }

  .health-ring {
    position: relative;
    margin: 0 auto 12px;
    flex: none;
  }
  .health-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    overflow: visible;
  }
  .health-ring-track {
    fill: none;
    stroke-width: 9;
  }
  .health-ring-value {
    fill: none;
    stroke-width: 9;
    stroke-linecap: round;
    filter: drop-shadow(0 0 7px currentColor);
  }
  .health-ring--good .health-ring-value { stroke: var(--cockpit-good); color: var(--cockpit-good); }
  .health-ring--ok .health-ring-value { stroke: var(--cockpit-ok); color: var(--cockpit-ok); }
  .health-ring--warn .health-ring-value { stroke: var(--cockpit-warn); color: var(--cockpit-warn); }
  .health-ring--bad .health-ring-value { stroke: var(--cockpit-bad); color: var(--cockpit-bad); }
  .health-ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
  }
  .health-ring-center strong {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .health-ring-center span { font-size: 10px; color: var(--text-3); letter-spacing: 0.04em; }
`;

export function healthRingTone(score: number): 'good' | 'ok' | 'warn' | 'bad' {
  if (score >= 80) return 'good';
  if (score >= 60) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

/** SVG health ring — matches packages/ui HealthRing component. */
export function renderHealthRingHtml(score: number, size = 120): string {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const tone = healthRingTone(safe);
  return `<div class="health-ring health-ring--${tone}" style="width:${size}px;height:${size}px" role="img" aria-label="Repository health ${safe} out of 100">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="health-ring-track" cx="60" cy="60" r="${radius}"/>
      <circle class="health-ring-value" cx="60" cy="60" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
    </svg>
    <div class="health-ring-center"><strong>${safe}</strong><span>/ 100</span></div>
  </div>`;
}
