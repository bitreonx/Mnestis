import { Link, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { FOCUS_MODE_META } from '@/dashboard'
import { useActiveRepo, useRepoIntelligence } from '@/cockpits/coder/CoderBridgeData'
import { formatScore, formatScoreLabel } from '@/lib/format-score'
import { buildModePath } from '@/lib/mode'
import { HealthRing } from '@/components/ui/HealthRing'
import { Skeleton } from '@/components/ui/skeleton'

export const VibeWorkspaceHeader = () => {
  const { repoId = 'local', section = 'story' } = useParams()
  const repo = useActiveRepo(repoId)
  const { loading, memory, healthScore } = useRepoIntelligence(repoId)

  if (loading) {
    return (
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-6 py-5">
        <Skeleton className="h-20 w-full max-w-3xl" />
      </div>
    )
  }

  const health = healthScore?.overall ?? repo.health
  const aiReadiness = repo.aiReadiness
  const missing = repo.status === 'missing' || health == null

  return (
    <header
      className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-6 py-5"
      style={{ '--repo-accent': repo.accent } as CSSProperties}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{repo.label}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{memory?.architecture.name || repo.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-fg-muted)]">
            {memory?.architecture.summary || repo.description || FOCUS_MODE_META.vibe.dashboardLens}
          </p>
          <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
            Scores are repository quality metrics — not Claude or Cursor API usage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {health != null && (
            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
              <HealthRing value={health} size={52} label="Repository health" />
              <div className="text-sm">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Health</p>
                <p className="font-semibold tabular-nums">{formatScore(health)}</p>
              </div>
            </div>
          )}
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm tabular-nums">
            {missing ? 'Build required' : formatScoreLabel('AI readiness', aiReadiness)}
          </span>
          <Link
            to={buildModePath('vibe', repoId, 'share')}
            className="rounded-[var(--radius-xs)] bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]"
          >
            Share
          </Link>
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-5xl text-xs text-[var(--color-fg-muted)]">
        Viewing <strong className="text-[var(--color-fg)]">{section}</strong> · {FOCUS_MODE_META.vibe.label} mode
      </p>
    </header>
  )
}
