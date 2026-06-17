import { Link, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { FOCUS_MODE_META } from '@/dashboard'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import type { RepoSection } from '@/components/RepoWorkspace'
import { buildModePath } from '@/lib/mode'
import { formatScoreLabel } from '@/lib/format-score'

const SECTIONS: { id: RepoSection; label: string; desc: string }[] = [
  { id: 'overview', label: 'Overview', desc: 'Health, stats, quick start' },
  { id: 'architecture', label: 'Architecture', desc: 'Systems, domains, graph' },
  { id: 'flows', label: 'Flows', desc: 'Execution paths & journeys' },
  { id: 'code', label: 'Code Map', desc: 'Files & tech stack' },
  { id: 'history', label: 'History', desc: 'Builds, timeline, hotspots' },
  { id: 'ai', label: 'AI Context', desc: 'Copilot & agent docs' },
]

export const CoderWorkspaceHeader = () => {
  const { repo, focusMode, healthScore, building, handleBuild } = useRepoWorkspace()
  const { section = 'overview', repoId = 'local' } = useParams()

  return (
    <header className="repo-workspace-header" style={{ '--repo-accent': repo.accent } as CSSProperties}>
      <div className="repo-workspace-meta">
        <div className="repo-workspace-identity">
          <p className="repo-workspace-label">{repo.label}</p>
          <h1>{repo.name}</h1>
          <p className="repo-workspace-desc">{repo.description}</p>
          <div className="repo-focus-row">
            <span className="repo-focus-badge">{FOCUS_MODE_META[focusMode].label} mode</span>
            <span className="repo-focus-copy">{FOCUS_MODE_META[focusMode].dashboardLens}</span>
          </div>
        </div>
        <div className="repo-workspace-actions">
          <span className="repo-meta-chip">{repo.label}</span>
          <span className={`status-pill status-pill--${repo.status}`}>{formatScoreLabel('Health', repo.health ?? healthScore?.overall ?? null)}</span>
          <button type="button" className="repo-build-btn repo-build-btn--inline" onClick={handleBuild} disabled={building}>
            {building ? 'Building…' : 'Run Mnemos'}
          </button>
        </div>
      </div>
      <nav className="repo-section-nav" aria-label="Workspace sections">
        {SECTIONS.map((s) => (
          <Link
            key={s.id}
            to={buildModePath('coder', repoId, s.id)}
            className={`repo-section-btn ${section === s.id ? 'repo-section-btn--active' : ''}`}
            aria-current={section === s.id ? 'page' : undefined}
          >
            <strong>{s.label}</strong>
            <span>{s.desc}</span>
          </Link>
        ))}
      </nav>
    </header>
  )
}

export const CoderWorkspaceLoading = () => (
  <div className="repo-workspace repo-workspace--loading">
    <div className="dash-loader" />
    <p>Loading repository intelligence…</p>
  </div>
)
