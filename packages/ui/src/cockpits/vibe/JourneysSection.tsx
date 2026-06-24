import { Map } from 'lucide-react'
import { JourneyMapView } from '@/components/JourneyMapView'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { PageLayout, PageHeader, LoadingState, EmptyState, ContentWell } from '@/shell/PageLayout'
import { Button } from '@/components/ui/button'

export const JourneysSection = () => {
  const { loading, memory, error, handleBuild, building } = useIntelligence()

  if (loading) return <LoadingState />
  if (!memory) {
    return (
      <PageLayout>
        <EmptyState
          title="No journey data"
          description={error ?? 'Run mnestis build on this repository first.'}
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
    <PageLayout wide>
      <PageHeader
        title="User journeys"
        description="How people move through the product — mapped from entry points and execution flows."
        icon={<Map className="h-6 w-6" />}
      />
      <ContentWell>
        <JourneyMapView journeys={memory.journeys ?? []} flows={memory.flows} />
      </ContentWell>
    </PageLayout>
  )
}
