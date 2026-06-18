import { Link, useNavigate, useParams } from 'react-router-dom'
import { Terminal } from 'lucide-react'
import { type FocusMode, FOCUS_MODE_META } from '@/dashboard'
import { MODE_SECTIONS } from '@/core/navigation'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LangSwitcher } from '@/components/ui/LangSwitcher'
import { Button } from '@/components/ui/button'
import { Legend } from '@/cockpits/shared/Legend'
import { buildModePath, setStoredMode } from '@/lib/mode'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { Gauge } from '@/components/viz'
import { formatScoreLabel } from '@/lib/format-score'

interface SidebarProps {
  mode: FocusMode
  repoId: string
  section: string
  workspaceMode: boolean
  repos: { id: string; name: string }[]
  onRepoChange: (id: string) => void
}

export const Sidebar = ({
  mode,
  repoId,
  section,
  workspaceMode,
  repos,
  onRepoChange,
}: SidebarProps) => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { pulse, building, handleBuild, repo } = useIntelligence()

  const handleModeChange = (next: FocusMode) => {
    setStoredMode(next)
    navigate(buildModePath(next, repoId))
  }

  const sections = MODE_SECTIONS[mode]

  return (
    <aside className="glass-sidebar relative flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-e">
      <div className="relative flex items-center gap-2.5 border-b border-[var(--glass-border)] px-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-[var(--radius-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label={t('shell.home')}
        >
          <MnemosLogo size={26} />
          <span className="font-semibold tracking-tight">Mnemos</span>
        </Link>
      </div>

      <div className="border-b border-[var(--glass-border)] p-3">
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {t('shell.cockpitMode')}
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] p-1">
          {(['vibe', 'ai', 'coder'] as FocusMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={cn(
                'rounded-[var(--radius-xs)] px-2 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                mode === m
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm'
                  : 'text-[var(--color-fg-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--color-fg)]',
              )}
              aria-current={mode === m ? 'true' : undefined}
            >
              {t(`modes.${m}.short`)}
            </button>
          ))}
        </div>
        <p className="mt-2 px-1 text-[10px] leading-snug text-[var(--color-muted)]">
          {FOCUS_MODE_META[mode].dashboardLens}
        </p>
      </div>

      {pulse.health != null && (
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
          <Gauge value={pulse.health} size={52} showScale={false} label="Health" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-muted)]">Health</p>
            <p className="truncate text-sm font-semibold tabular-nums">
              {formatScoreLabel('', pulse.health).replace(': ', '')}
            </p>
            {pulse.healthDelta != null && (
              <p
                className={cn(
                  'text-[10px] tabular-nums',
                  pulse.healthDelta >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]',
                )}
              >
                {pulse.healthDelta >= 0 ? '+' : ''}
                {pulse.healthDelta} since last build
              </p>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3" aria-label={`${mode} sections`}>
        <ul className="space-y-1">
          {sections.map((item) => {
            const Icon = item.icon
            const active = section === item.id
            return (
              <li key={item.id}>
                <Link
                  to={buildModePath(mode, repoId, item.id)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                    active
                      ? 'glass-panel glass-panel--elevated text-[var(--color-fg)]'
                      : 'text-[var(--color-fg-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--color-fg)]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.desc && (
                      <p className="truncate text-[10px] text-[var(--color-muted)]">{item.desc}</p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-2 border-t border-[var(--glass-border)] p-3">
        <p className="truncate px-1 text-[10px] text-[var(--color-muted)]" title={repo.path}>
          {repo.name}
        </p>
        {workspaceMode && repos.length > 1 && (
          <select
            value={repoId}
            onChange={(e) => onRepoChange(e.target.value)}
            className="glass-panel w-full rounded-[var(--radius-xs)] px-2 py-1.5 text-xs"
            aria-label={t('shell.selectRepo')}
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleBuild}
          disabled={building}
        >
          {building ? 'Building…' : 'Run Mnemos'}
        </Button>
      </div>
    </aside>
  )
}

interface TopBarProps {
  mode: FocusMode
  repoName: string
  section: string
  onToggleTerminal: () => void
  terminalOpen: boolean
}

export const TopBar = ({ mode, repoName, section, onToggleTerminal, terminalOpen }: TopBarProps) => {
  const { t } = useI18n()
  const { repoId = 'local' } = useParams()

  return (
    <header className="glass-topbar relative z-10 flex shrink-0 items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {repoName}
          <span className="mx-2 text-[var(--color-muted)]">/</span>
          <span className="text-[var(--color-fg-muted)]">{section}</span>
        </p>
        <p className="truncate text-[10px] text-[var(--color-muted)]">{t(`modes.${mode}.lens`)}</p>
      </div>

      <Legend active="dashboard" repoId={repoId} />

      <ThemeToggle />
      <LangSwitcher />

      <Button
        variant={terminalOpen ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Toggle terminal"
        aria-pressed={terminalOpen}
        onClick={onToggleTerminal}
      >
        <Terminal className="h-4 w-4" />
      </Button>
    </header>
  )
}
