import type { CSSProperties } from 'react';
import { formatScore, formatScoreLabel } from '@/lib/format-score';
import type { RepoSnapshot, WorkspaceSummary } from '../lib/workspace';
import { FOCUS_MODE_META, type FocusMode } from '../dashboard';
import { MnemosLogo } from './illustrations/MnemosLogo';
import { HealthRing } from './ui/HealthRing';

interface GlobalOverviewProps {
  workspace: WorkspaceSummary;
  onOpenRepo: (id: string) => void;
  onBuild: (id: string) => void;
  onBuildAll: () => void;
  buildingAll: boolean;
  focusMode: FocusMode;
}

const MODE_COPY: Record<
  FocusMode,
  {
    lead: string;
    now: string;
    next: string;
  }
> = {
  vibe: {
    lead: 'See what each product area does, which user journeys matter most, and where the risky or unclear parts live.',
    now: 'Start with repo summaries, capabilities, and journeys.',
    next: 'Open the strongest repo first, then move to flows and report mode for sharing.',
  },
  ai: {
    lead: 'See which repositories are ready for agents, where the gaps are, and which artifacts an AI can consume without opening every screen.',
    now: 'Start with AI readiness, issue hotspots, and copy-ready outputs.',
    next: 'Open a repo and jump to AI Context for JSON, docs, and repair packs.',
  },
  coder: {
    lead: 'See architecture quality, flow coverage, code hotspots, and the safest place to enter the system before making changes.',
    now: 'Start with health, build coverage, and repo-level architecture summaries.',
    next: 'Open a repo and move through overview, architecture, and history in that order.',
  },
};

function healthColor(score: number): string {
  if (score >= 80) return 'var(--cockpit-good)';
  if (score >= 60) return 'var(--cockpit-ok)';
  if (score >= 40) return 'var(--cockpit-warn)';
  return 'var(--cockpit-bad)';
}

function healthTone(score: number | undefined): 'good' | 'ok' | 'warn' | 'bad' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 80) return 'good';
  if (score >= 60) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

export function GlobalOverview({
  workspace,
  onOpenRepo,
  onBuild,
  onBuildAll,
  buildingAll,
  focusMode,
}: GlobalOverviewProps) {
  const ready = workspace.repos.filter((r) => r.status === 'ready');
  const missing = workspace.repos.filter((r) => r.status === 'missing');
  const avgAi =
    ready.length > 0
      ? Math.round(ready.reduce((sum, repo) => sum + (repo.aiReadiness ?? 0), 0) / ready.length)
      : 0;
  const avgHealth =
    ready.length > 0 ? Math.round(ready.reduce((sum, repo) => sum + (repo.health ?? 0), 0) / ready.length) : 0;
  const avgBuildSeconds =
    ready.length > 0
      ? (ready.reduce((sum, repo) => sum + (repo.stats?.durationMs ?? 0), 0) / ready.length / 1000).toFixed(1)
      : '0.0';
  const highestRiskRepo =
    [...workspace.repos].sort((a, b) => (a.health ?? 101) - (b.health ?? 101))[0] ?? workspace.repos[0];
  const activeMode = FOCUS_MODE_META[focusMode];
  const modeCopy = MODE_COPY[focusMode];

  return (
    <div className="global-overview global-overview--lux">
      <div className="go-aurora" aria-hidden="true">
        <span className="go-aurora-blob go-aurora-blob--1" />
        <span className="go-aurora-blob go-aurora-blob--2" />
        <span className="go-aurora-blob go-aurora-blob--3" />
      </div>

      <section className="go-hero go-hero--grand">
        <div className="go-hero-copy">
          <div className="go-brand">
            <span className="go-brand-mark">
              <MnemosLogo size={48} />
            </span>
            <span className="go-brand-text">
              <span className="go-brand-name">Mnemos</span>
              <span className="go-brand-tag">Repository Intelligence</span>
            </span>
          </div>
          <p className="go-kicker">Repository understanding from zero to action</p>
          <h1>{workspace.workspace}</h1>
          <p className="go-lead">{modeCopy.lead}</p>
          <div className="go-hero-badges">
            <span>{workspace.repos.length} repositories</span>
            <span>{workspace.totalFiles.toLocaleString()} files indexed</span>
            <span>{ready.length} ready right now</span>
            <span>Mode: {activeMode.label}</span>
          </div>
        </div>

        <aside className="go-hero-panel">
          <p className="go-panel-kicker">Current lens</p>
          <h2>{activeMode.title}</h2>
          <p>{activeMode.dashboardLens}</p>
          <div className="go-panel-list">
            <div>
              <strong>Now</strong>
              <span>{modeCopy.now}</span>
            </div>
            <div>
              <strong>Next</strong>
              <span>{modeCopy.next}</span>
            </div>
          </div>
          <button type="button" className="go-primary-btn" onClick={onBuildAll} disabled={buildingAll}>
            {buildingAll ? 'Analyzing all repositories…' : 'Analyze all repositories'}
          </button>
        </aside>
      </section>

      <section className="go-experience-grid">
        <article className="go-story-card go-story-card--primary">
          <small>Interactive dashboard</small>
          <h3>`mnemos ui`</h3>
          <p>Use the dashboard when you want to explore, compare repos, inspect scores, trace flows, and work interactively.</p>
        </article>
        <article className="go-story-card">
          <small>Static report</small>
          <h3>`report/index.html`</h3>
          <p>Use the report when you want a shareable artifact for teammates, founders, demos, or async reviews.</p>
        </article>
        <article className="go-story-card">
          <small>Agent artifact</small>
          <h3>`project.dna.json`</h3>
          <p>Use JSON and context files when AI should answer or fix something without clicking through the UI first.</p>
        </article>
      </section>

      <section className="go-mode-grid">
        {(Object.entries(FOCUS_MODE_META) as Array<[FocusMode, (typeof FOCUS_MODE_META)[FocusMode]]>).map(([id, meta]) => (
          <article key={id} className={`go-mode-card ${focusMode === id ? 'go-mode-card--active' : ''}`}>
            <small>{meta.shortLabel}</small>
            <h3>{meta.label}</h3>
            <p>{meta.description}</p>
          </article>
        ))}
      </section>

      <section className="go-metrics">
        <article className="go-metric go-metric--hero">
          <HealthRing value={workspace.aggregateHealth} label="Aggregate health" />
          <div className="go-metric-hero-body">
            <span>Aggregate health</span>
            <strong style={{ color: healthColor(workspace.aggregateHealth) }}>
              {workspace.aggregateHealth >= 80 ? 'Healthy' : workspace.aggregateHealth >= 60 ? 'Stable' : workspace.aggregateHealth >= 40 ? 'At risk' : 'Critical'}
            </strong>
            <small>{ready.length}/{workspace.repos.length} repositories ready</small>
          </div>
        </article>
        <article className="go-metric">
          <span>Average ready repo health</span>
          <strong>{formatScore(avgHealth)}</strong>
          <small>Across scanned repositories</small>
        </article>
        <article className="go-metric">
          <span>AI readiness</span>
          <strong>{formatScore(avgAi)}</strong>
          <small>Structured context quality — not API usage</small>
        </article>
        <article className="go-metric">
          <span>Flows traced</span>
          <strong>{workspace.totalFlows}</strong>
          <small>Execution paths mapped</small>
        </article>
        <article className="go-metric">
          <span>Average build time</span>
          <strong>{avgBuildSeconds}s</strong>
          <small>Mean Mnemos analysis time</small>
        </article>
      </section>

      <section className="go-capabilities">
        <div className="go-section-head">
          <h2>How Mnemos works</h2>
          <p>From raw code to understandable intelligence, with one clear path for humans and one clear path for AI.</p>
        </div>
        <div className="go-cap-grid">
          <article>
            <h3>1. Analyze the repository</h3>
            <p>Mnemos scans files, relationships, domains, flows, smells, capabilities, and journeys.</p>
          </article>
          <article>
            <h3>2. Score what matters</h3>
            <p>Health and readiness summarize discoverability, architecture clarity, documentation, coupling, and complexity.</p>
          </article>
          <article>
            <h3>3. Produce outputs</h3>
            <p>The dashboard is interactive, the report is shareable, and the JSON context is ready for agents and automation.</p>
          </article>
          <article>
            <h3>4. Move to action</h3>
            <p>Open a repo, inspect risks, copy prompts or JSON, and route a human or AI directly to the right area.</p>
          </article>
        </div>
      </section>

      {missing.length > 0 && (
        <section className="go-alert">
          <strong>{missing.length} repository{missing.length === 1 ? '' : 'ies'} still need a build.</strong> Run Mnemos to unlock scores, flows, context docs, and AI exports.
        </section>
      )}

      {highestRiskRepo && (
        <section className="go-priority-strip">
          <div>
            <small>Most urgent repo</small>
            <strong>{highestRiskRepo.name}</strong>
            <span>{highestRiskRepo.highestRisk ?? highestRiskRepo.mostCritical ?? 'Open it to inspect the highest-risk area.'}</span>
          </div>
          <button type="button" className="go-open-btn" disabled={highestRiskRepo.status !== 'ready'} onClick={() => onOpenRepo(highestRiskRepo.id)}>
            Open priority repo
          </button>
        </section>
      )}

      <section className="go-repos">
        <div className="go-section-head">
          <h2>Repositories</h2>
          <p>Each card shows what is ready, what is risky, and which output is most useful for your current mode.</p>
        </div>
        <div className="go-repo-grid">
          {workspace.repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} onOpen={onOpenRepo} onBuild={onBuild} focusMode={focusMode} />
          ))}
        </div>
      </section>

      <section className="go-onboard">
        <h2>Zero-to-value path</h2>
        <ol>
          <li>Build a repo if it is not ready yet.</li>
          <li>Open the dashboard when you want to explore and compare architecture interactively.</li>
          <li>Open `report/index.html` when you want to share a readable story with other humans.</li>
          <li>Open AI Context inside a repo when an agent needs JSON, docs, or a copyable repair pack.</li>
          <li>Use <kbd>Ctrl K</kbd>, <kbd>Ctrl I</kbd>, and <kbd>Ctrl `</kbd> to jump between commands, AI help, and terminal workflows.</li>
        </ol>
      </section>
    </div>
  );
}

function RepoCard({
  repo,
  onOpen,
  onBuild,
  focusMode,
}: {
  repo: RepoSnapshot;
  onOpen: (id: string) => void;
  onBuild: (id: string) => void;
  focusMode: FocusMode;
}) {
  const ready = repo.status === 'ready';
  const statusTone = healthTone(repo.health);
  const lensMessage =
    focusMode === 'vibe'
      ? repo.topCapabilities?.slice(0, 2).join(' • ') || 'Open this repo to see its main product capabilities.'
      : focusMode === 'ai'
        ? repo.highestRisk || repo.mostCritical || 'Open this repo for AI-ready JSON, context docs, and repair packs.'
        : repo.description;

  return (
    <article className="go-repo-card" style={{ '--repo-accent': repo.accent } as CSSProperties}>
      <header>
        <div>
          <small>{repo.label}</small>
          <h3>{repo.name}</h3>
        </div>
        <span className={`go-status go-status--${repo.status}`}>{repo.status}</span>
      </header>

      <p>{lensMessage}</p>

      <div className="go-repo-strip">
        <span className={`go-health-pill go-health-pill--${statusTone}`}>{formatScoreLabel('Health', repo.health ?? null)}</span>
        <span>{formatScoreLabel('AI readiness', repo.aiReadiness ?? null)}</span>
        <span>{ready ? 'Dashboard + report + JSON ready' : 'Build required'}</span>
      </div>

      {ready && repo.stats && (
        <div className="go-repo-stats">
          <span>{repo.stats.files.toLocaleString()} files</span>
          <span>{repo.stats.domains} domains</span>
          <span>{repo.stats.flows} flows</span>
          <span>{(repo.stats.durationMs / 1000).toFixed(1)}s build</span>
        </div>
      )}

      {repo.topCapabilities && repo.topCapabilities.length > 0 && (
        <div className="go-chips">
          {repo.topCapabilities.slice(0, 3).map((capability) => (
            <span key={capability}>{capability}</span>
          ))}
        </div>
      )}

      <footer>
        <button type="button" className="go-open-btn" disabled={!ready} onClick={() => onOpen(repo.id)}>
          Open dashboard
        </button>
        <button type="button" className="go-build-btn" disabled={repo.status === 'building'} onClick={() => onBuild(repo.id)}>
          {repo.status === 'building' ? 'Building…' : ready ? 'Rebuild' : 'Build'}
        </button>
      </footer>
    </article>
  );
}
