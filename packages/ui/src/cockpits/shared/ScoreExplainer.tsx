import { useState } from 'react'
import { ChevronDown, TrendingDown, TrendingUp } from 'lucide-react'
import type { HealthScore } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Gauge } from '@/components/viz'
import { cn } from '@/lib/utils'
import { formatScore } from '@/lib/format-score'

export interface ScoreDimension {
  name: string
  value: number
  definition: string
  formula?: string
}

export interface ScoreFactor {
  name: string
  delta: number
  evidence: string
}

interface ScoreExplainerProps {
  overall: number
  aiReadinessOverall?: number
  narrative?: string
  tone?: 'great' | 'good' | 'warn' | 'bad'
  healthDimensions: ScoreDimension[]
  aiDimensions?: ScoreDimension[]
  strongest?: { name: string; value: number } | null
  weakest?: { name: string; value: number } | null
  factors?: ScoreFactor[]
  compact?: boolean
  className?: string
}

const toneBadge = (score: number) => {
  if (score >= 80) return { label: 'Great', variant: 'success' as const }
  if (score >= 60) return { label: 'Good', variant: 'secondary' as const }
  if (score >= 40) return { label: 'Needs work', variant: 'warn' as const }
  return { label: 'At risk', variant: 'danger' as const }
}

export const healthScoreToDimensions = (health: HealthScore): ScoreDimension[] => [
  { name: 'Discoverability', value: health.discoverability, definition: 'How quickly a human or AI can find the right files, domains, and entry points.' },
  { name: 'Architecture clarity', value: health.architectureClarity, definition: 'How understandable the structure is after penalties from detected smells.' },
  { name: 'Coupling', value: health.coupling, definition: 'How contained modules stay vs pulling across services.' },
  { name: 'Documentation', value: health.documentationQuality, definition: 'How well domains and system shape are described in generated context.' },
  { name: 'Dependency complexity', value: health.dependencyComplexity, definition: 'Cross-domain and dependency sprawl increasing change risk.' },
]

export const ScoreExplainer = ({
  overall,
  aiReadinessOverall,
  narrative,
  healthDimensions,
  aiDimensions = [],
  strongest,
  weakest,
  factors = [],
  compact = false,
  className,
}: ScoreExplainerProps) => {
  const [showFactors, setShowFactors] = useState(false)
  const badge = toneBadge(overall)

  return (
    <div className={cn('space-y-4 score-explainer-lux', className)}>
      <Card className="repo-health-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Gauge value={overall} size={108} label="Repository health" />
            <div>
              <CardTitle className="text-base">Repository health</CardTitle>
              {narrative && <p className="mt-1 max-w-md text-sm text-[var(--color-fg-muted)]">{narrative}</p>}
            </div>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </CardHeader>
        {!compact && (
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {healthDimensions.map((dim) => (
              <div key={dim.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dim.name}</span>
                  <span className="tabular-nums text-[var(--color-fg-muted)]">{formatScore(dim.value)}</span>
                </div>
                <Progress value={dim.value} aria-label={dim.name} />
                <details className="text-xs text-[var(--color-fg-muted)]">
                  <summary className="cursor-pointer hover:text-[var(--color-fg)]">What is this?</summary>
                  <p className="mt-1">{dim.definition}</p>
                  {dim.formula && <p className="mt-1 font-mono text-[10px]">{dim.formula}</p>}
                </details>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {!compact && (strongest || weakest) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {strongest && (
            <Card>
              <CardContent className="flex items-start gap-2 pt-4">
                <TrendingUp className="h-4 w-4 text-[var(--color-success)]" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--color-muted)]">Strongest</p>
                  <p className="font-semibold">{strongest.name}: {formatScore(strongest.value)}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {weakest && (
            <Card>
              <CardContent className="flex items-start gap-2 pt-4">
                <TrendingDown className="h-4 w-4 text-[var(--color-warn)]" aria-hidden />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--color-muted)]">Weakest</p>
                  <p className="font-semibold">{weakest.name}: {formatScore(weakest.value)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!compact && aiReadinessOverall != null && aiDimensions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI readiness — {aiReadinessOverall}/100</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {aiDimensions.map((dim) => (
              <div key={dim.name} className="text-sm">
                <div className="flex justify-between"><span>{dim.name}</span><span className="tabular-nums">{formatScore(dim.value)}</span></div>
                <Progress value={dim.value} className="mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!compact && factors.length > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm"
            onClick={() => setShowFactors((v) => !v)}
            aria-expanded={showFactors}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showFactors && 'rotate-180')} />
            Why is this number what it is?
          </button>
          {showFactors && (
            <ul className="mt-3 space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-4 text-sm">
              {factors.map((f) => (
                <li key={f.name} className="flex justify-between gap-4">
                  <span>{f.name} <span className="text-[var(--color-fg-muted)]">— {f.evidence}</span></span>
                  <span className={cn('tabular-nums font-medium', f.delta < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]')}>
                    {f.delta > 0 ? '+' : ''}{f.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
