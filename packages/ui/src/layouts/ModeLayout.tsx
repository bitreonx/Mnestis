import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { FOCUS_MODE_META, type FocusMode } from '@/dashboard'
import { Legend } from '@/cockpits/shared/Legend'
import { LegendSpotlight } from '@/cockpits/shared/LegendSpotlight'
import { ToggleGroup } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { fetchWorkspace, type RepoSnapshot } from '@/lib/workspace'
import { buildModePath, setStoredMode, setStoredRepoId } from '@/lib/mode'
import { cn } from '@/lib/utils'
import { CockpitTerminalPanel } from '@/components/layout/CockpitTerminalPanel'
import { DashboardPreviewBanner } from '@/components/layout/DashboardPreviewBanner'
import type { TerminalMode } from '@/components/IntegratedTerminal'

interface ModeLayoutProps {
  mode: FocusMode
  children?: ReactNode
}

export const ModeLayout = ({ mode, children }: ModeLayoutProps) => {
  const { repoId = 'local', section = 'overview' } = useParams()
  const navigate = useNavigate()
  const [repos, setRepos] = useState<RepoSnapshot[]>([])
  const [workspaceMode, setWorkspaceMode] = useState(false)

  useEffect(() => {
    setStoredMode(mode)
    if (repoId) setStoredRepoId(repoId)
  }, [mode, repoId])

  useEffect(() => {
    fetchWorkspace()
      .then((ws) => {
        setWorkspaceMode(true)
        setRepos(ws.repos)
      })
      .catch(() => setWorkspaceMode(false))
  }, [])

  const activeRepo = repos.find((r) => r.id === repoId)

  const handleModeChange = (next: string) => {
    const m = next as FocusMode
    setStoredMode(m)
    navigate(buildModePath(m, repoId))
  }

  const modeOptions = (['vibe', 'ai', 'coder'] as FocusMode[]).map((m) => ({
    value: m,
    label: FOCUS_MODE_META[m].shortLabel,
  }))

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <LegendSpotlight />
      <DashboardPreviewBanner />
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm" aria-label="Mnemos home">
          <MnemosLogo size={28} />
          <span className="hidden font-semibold sm:inline">Mnemos</span>
        </Link>

        <ToggleGroup
          value={mode}
          onValueChange={handleModeChange}
          options={modeOptions}
          ariaLabel="Cockpit mode"
        />

        <Legend active="dashboard" repoId={repoId} className="ml-auto" />

        {workspaceMode && repos.length > 1 && (
          <select
            value={repoId}
            onChange={(e) => navigate(buildModePath(mode, e.target.value, section))}
            className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-sm"
            aria-label="Select repository"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        <Button variant="ghost" size="icon" aria-label="Refresh" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </header>

      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2">
        <Breadcrumb
          items={[
            { label: FOCUS_MODE_META[mode].label, onClick: () => navigate(buildModePath(mode, repoId)) },
            { label: activeRepo?.name ?? repoId },
            { label: section },
          ]}
        />
        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{FOCUS_MODE_META[mode].dashboardLens}</p>
      </div>

      <main className={cn('min-h-0 flex-1 overflow-auto')} id="mnemos-capture-root">
        {children ?? <Outlet />}
      </main>

      <CockpitTerminalPanel
        repoId={repoId}
        repositoryPath={activeRepo?.path ?? repoId}
        mode={mode as TerminalMode}
      />
    </div>
  )
}
