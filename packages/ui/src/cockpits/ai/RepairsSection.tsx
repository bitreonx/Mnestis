import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { IssueCard } from '@/components/issues/IssueCard'
import { Skeleton } from '@/components/ui/skeleton'
import { RepairPlanTray } from '@/cockpits/shared/RepairPlanTray'
import { fetchAiPackParsed, type AiPackIssue } from '@/lib/ai-pack-client'

export const RepairsSection = () => {
  const { repoId = 'local' } = useParams()
  const [issues, setIssues] = useState<AiPackIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<AiPackIssue[]>([])

  useEffect(() => {
    fetchAiPackParsed(repoId, { section: 'issues', mode: 'ai' })
      .then((pack) => setIssues(pack.issues?.slice(0, 6) ?? []))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false))
  }, [repoId])

  const handleAddToPlan = (issue: AiPackIssue) => {
    setPlan((prev) => (prev.some((i) => i.id === issue.id) ? prev : [...prev, issue]))
  }

  if (loading) return <div className="p-8 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Top repairs for AI agents</h2>
        <p className="text-sm text-[var(--color-fg-muted)]">Each issue includes copy-ready JSON and a pre-built prompt.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} repoId={repoId} onAddToPlan={handleAddToPlan} />
        ))}
      </div>
      <RepairPlanTray issues={plan} repoId={repoId} onClear={() => setPlan([])} />
    </div>
  )
}
