import { Sparkles } from 'lucide-react'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { PageLayout, PageHeader, LoadingState, EmptyState } from '@/shell/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useParams } from 'react-router-dom'
import { buildModePath } from '@/lib/mode'
import { StatTile } from '@/components/viz'
import { Button } from '@/components/ui/button'

export const StorySection = () => {
  const { repoId = 'local' } = useParams()
  const { loading, error, memory, topCaps, topJrns, pulse, handleBuild, building } = useIntelligence()

  if (loading) return <LoadingState />
  if (!memory) {
    return (
      <PageLayout>
        <EmptyState
          title="No story yet"
          description={error ?? 'Run Mnemos to discover what this product does.'}
          action={
            <Button onClick={handleBuild} disabled={building}>
              {building ? 'Building…' : 'Run Mnemos'}
            </Button>
          }
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Product story"
        title={memory.architecture.name || memory.repository}
        description={memory.architecture.summary}
        icon={<Sparkles className="h-6 w-6" />}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Capabilities" value={pulse.capabilities} />
        <StatTile label="Journeys" value={topJrns.length} />
        <StatTile label="Domains" value={pulse.domains} />
        <StatTile label="Health" value={pulse.health ?? 0} unit={pulse.health != null ? '/100' : undefined} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What this product does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--color-fg-muted)]">
            {memory.architecture.type} — {memory.domains.length} domains, {memory.flows.length} flows,{' '}
            {memory.stats.filesScanned.toLocaleString()} files scanned.
          </p>
          {topCaps.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {topCaps.map((c) => (
                <li
                  key={c.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2.5 text-sm"
                >
                  <p className="font-medium">{c.signature.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">{c.signature.purpose}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {topJrns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Main user journeys</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topJrns.map((j) => (
                <li key={j.id} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm">
                  <strong>{j.signature.name}</strong>
                  {j.entryPoint && (
                    <span className="text-[var(--color-fg-muted)]"> — entry: {j.entryPoint}</span>
                  )}
                </li>
              ))}
            </ul>
            <Link
              to={buildModePath('vibe', repoId, 'journeys')}
              className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline"
            >
              Explore all journeys →
            </Link>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  )
}
