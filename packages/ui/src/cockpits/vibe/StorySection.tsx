import { Link, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useRepoIntelligence } from '@/cockpits/coder/CoderBridgeData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { buildModePath } from '@/lib/mode'

export const StorySection = () => {
  const { repoId = 'local' } = useParams()
  const { loading, memory } = useRepoIntelligence(repoId)

  if (loading || !memory) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32 w-full" /></div>
  }

  const capabilities = memory.capabilities?.slice(0, 5) ?? []
  const journeys = memory.journeys?.slice(0, 3) ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <div className="flex items-start gap-4">
        <Sparkles className="h-8 w-8 text-[var(--color-accent)]" aria-hidden />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{memory.architecture.name || memory.repository}</h1>
          <p className="mt-2 text-lg text-[var(--color-fg-muted)]">{memory.architecture.summary}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What this product does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{memory.architecture.type} — {memory.domains.length} domains, {memory.flows.length} flows, {memory.stats.filesScanned} files scanned.</p>
          {capabilities.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {capabilities.map((c: NonNullable<typeof memory.capabilities>[number]) => (
                <li key={c.id} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm">
                  {c.signature.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {journeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Main user journeys</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {journeys.map((j: NonNullable<typeof memory.journeys>[number]) => (
                <li key={j.id} className="text-sm">
                  <strong>{j.signature.name}</strong>
                  {j.entryPoint && <span className="text-[var(--color-fg-muted)]"> — entry: {j.entryPoint}</span>}
                </li>
              ))}
            </ul>
            <Link
              to={buildModePath('vibe', repoId, 'journeys')}
              className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm"
            >
              Explore all journeys
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

