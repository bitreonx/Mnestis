import { GitBranch } from 'lucide-react'
import { FlowsView } from '@/components/DomainsView'
import { JourneyMapView } from '@/components/JourneyMapView'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { PageLayout, PageHeader, LoadingState, ContentWell } from '@/shell/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DimensionBars } from '@/components/viz'

export const FlowsSection = () => {
  const { loading, memory, flowRanks } = useIntelligence()
  if (loading || !memory) return <LoadingState />

  return (
    <PageLayout wide>
      <PageHeader
        title="Flows & journeys"
        description="Execution paths ranked by centrality — where changes have the widest blast radius."
        icon={<GitBranch className="h-6 w-6" />}
      />

      {flowRanks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Flow centrality ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <DimensionBars
              items={flowRanks.slice(0, 8).map((f) => ({
                name: f.name,
                value: f.centrality,
              }))}
              max={flowRanks[0]?.centrality ?? 100}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ContentWell>
          <FlowsView flows={memory.flows} />
        </ContentWell>
        <ContentWell>
          <JourneyMapView journeys={memory.journeys ?? []} flows={memory.flows} />
        </ContentWell>
      </div>
    </PageLayout>
  )
}
