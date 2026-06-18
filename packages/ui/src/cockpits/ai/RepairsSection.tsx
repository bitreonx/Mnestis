import { Wrench } from 'lucide-react'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { IssueCard } from '@/components/issues/IssueCard'
import { RepairPlanTray } from '@/cockpits/shared/RepairPlanTray'
import { PageLayout, PageHeader, LoadingState, EmptyState } from '@/shell/PageLayout'
import { Button } from '@/components/ui/button'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import type { AiPackIssue } from '@/lib/ai-pack-client'

export const RepairsSection = () => {
  const { repoId = 'local' } = useParams()
  const { loading, packIssues, handleBuild, building } = useIntelligence()
  const [plan, setPlan] = useState<AiPackIssue[]>([])

  const handleAddToPlan = (issue: AiPackIssue) => {
    setPlan((prev) => (prev.some((i) => i.id === issue.id) ? prev : [...prev, issue]))
  }

  if (loading) return <LoadingState />

  return (
    <PageLayout wide>
      <PageHeader
        title="Repairs"
        description="Top issues with copy-ready JSON and pre-built fix prompts for AI agents."
        icon={<Wrench className="h-6 w-6" />}
      />

      {packIssues.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {packIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} repoId={repoId} onAddToPlan={handleAddToPlan} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No repairs needed"
          description="Mnemos didn't detect major issues. Rebuild if you've changed the codebase."
          action={
            <Button onClick={handleBuild} disabled={building}>
              {building ? 'Building…' : 'Run Mnemos'}
            </Button>
          }
        />
      )}

      <RepairPlanTray issues={plan} repoId={repoId} onClear={() => setPlan([])} />
    </PageLayout>
  )
}
