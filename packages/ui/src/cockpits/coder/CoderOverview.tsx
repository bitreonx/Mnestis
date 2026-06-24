import { Link, useParams } from 'react-router-dom'
import { LayoutDashboard, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react'
import { Overview } from '@/components/Overview'
import { IssueCard } from '@/components/issues/IssueCard'
import { ScoreExplainer, healthScoreToDimensions } from '@/cockpits/shared/ScoreExplainer'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { PageLayout, PageHeader, MetricGrid, LoadingState, EmptyState } from '@/shell/PageLayout'
import { StatTile, DimensionBars } from '@/components/viz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copyText } from '@/lib/clipboard'
import { buildModePath } from '@/lib/mode'
import { scoreNarrative } from '@/core/intelligence'
import { useState } from 'react'

export const CoderOverview = () => {
  const { repoId = 'local' } = useParams()
  const {
    loading,
    error,
    memory,
    healthScore,
    packIssues,
    packScore,
    agentPackJson,
    fixPrompt,
    repo,
    pulse,
    domainRisks,
    flowRanks,
    smellClusters,
    healthInsights,
    handleBuild,
    building,
  } = useIntelligence()
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  if (loading) return <LoadingState />
  if (error || !memory) {
    return (
      <PageLayout>
        <EmptyState
          title="No intelligence yet"
          description={error ?? 'Run Mnemos to analyze this repository.'}
          action={
            <Button onClick={handleBuild} disabled={building}>
              {building ? 'Building…' : 'Run Mnemos'}
            </Button>
          }
        />
      </PageLayout>
    )
  }

  const handleCopy = async (label: string, text: string) => {
    await copyText(text)
    setCopyFeedback(label)
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  const dims = healthScore ? healthScoreToDimensions(healthScore) : []
  const highRiskDomains = domainRisks.filter((d) => d.risk === 'high').slice(0, 3)

  return (
    <PageLayout wide>
      <PageHeader
        eyebrow="Repository pulse"
        title={memory.architecture.name || repo.name}
        description={memory.architecture.summary || repo.description}
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleCopy('json', agentPackJson)}>
              {copyFeedback === 'json' ? 'Copied' : 'Copy AI Pack'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCopy('prompt', fixPrompt)}>
              {copyFeedback === 'prompt' ? 'Copied' : 'Copy fix prompt'}
            </Button>
          </>
        }
      />

      <MetricGrid cols={4}>
        <StatTile label="Files" value={pulse.files} />
        <StatTile label="Domains" value={pulse.domains} />
        <StatTile label="Flows" value={pulse.flows} />
        <StatTile label="Smells" value={pulse.smells} />
      </MetricGrid>

      {healthScore && (
        <section className="mt-8">
          <ScoreExplainer
            overall={healthScore.overall}
            aiReadinessOverall={packScore.aiReadinessOverall}
            narrative={packScore.narrative ?? scoreNarrative(healthScore.overall)}
            healthDimensions={dims}
            aiDimensions={packScore.aiDimensions}
            factors={packScore.factors}
            strongest={healthInsights.strongest}
            weakest={healthInsights.weakest}
          />
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
              Top flows by centrality
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flowRanks.length > 0 ? (
              <DimensionBars
                items={flowRanks.slice(0, 5).map((f) => ({
                  name: f.name,
                  value: f.centrality,
                }))}
                max={flowRanks[0]?.centrality ?? 100}
              />
            ) : (
              <p className="text-sm text-[var(--color-fg-muted)]">No flows detected.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-[var(--color-warn)]" />
              High-risk domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highRiskDomains.length > 0 ? (
              <ul className="space-y-2">
                {highRiskDomains.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-[var(--radius-xs)] border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <span>{d.name}</span>
                    <span className="tabular-nums text-[var(--color-danger)]">{d.score}/100</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-fg-muted)]">No high-risk domains detected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {smellClusters.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Smell clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {smellClusters.slice(0, 6).map((c) => (
                <span
                  key={c.type}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
                >
                  {c.type.replace(/_/g, ' ')} · {c.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Issues & repairs</h2>
          <Link to={buildModePath('ai', repoId, 'repairs')} className="text-sm text-[var(--color-accent)] hover:underline">
            View all repairs
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {packIssues.length > 0 ? (
            packIssues.map((issue) => <IssueCard key={issue.id} issue={issue} repoId={repoId} />)
          ) : (
            <EmptyState title="No major issues detected" description="Repository looks clean from Mnestis analysis." />
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { to: buildModePath('coder', repoId, 'architecture'), title: 'Architecture', desc: 'Systems, domains, graph' },
          { to: buildModePath('coder', repoId, 'flows'), title: 'Flows', desc: 'Execution paths' },
          { to: buildModePath('ai', repoId, 'json'), title: 'AI JSON', desc: 'Full agent pack' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="glass-panel group flex items-center justify-between p-4 transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow)]"
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-[var(--color-fg-muted)]">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Overview memory={memory} healthScore={healthScore} hideHealthScore />
      </div>
    </PageLayout>
  )
}
