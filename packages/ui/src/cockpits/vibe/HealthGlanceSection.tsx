import { HeartPulse } from 'lucide-react'
import { ScoreExplainer, healthScoreToDimensions } from '@/cockpits/shared/ScoreExplainer'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { PageLayout, PageHeader, LoadingState, EmptyState } from '@/shell/PageLayout'
import { Button } from '@/components/ui/button'
import { scoreNarrative } from '@/core/intelligence'

export const HealthGlanceSection = () => {
  const { loading, healthScore, packScore, healthInsights, error, handleBuild, building } = useIntelligence()

  if (loading) return <LoadingState />
  if (!healthScore) {
    return (
      <PageLayout>
        <EmptyState
          title="No health score"
          description={error ?? 'Run Mnemos to compute repository health.'}
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
        title="Health & readiness"
        description="Repository quality scores — structural health and AI agent readiness."
        icon={<HeartPulse className="h-6 w-6" />}
      />
      <ScoreExplainer
        overall={healthScore.overall}
        aiReadinessOverall={packScore.aiReadinessOverall}
        narrative={packScore.narrative ?? scoreNarrative(healthScore.overall)}
        healthDimensions={healthScoreToDimensions(healthScore)}
        aiDimensions={packScore.aiDimensions}
        factors={packScore.factors}
        strongest={healthInsights.strongest}
        weakest={healthInsights.weakest}
      />
    </PageLayout>
  )
}
