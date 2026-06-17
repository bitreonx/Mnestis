import { useParams } from 'react-router-dom'
import { useRepoIntelligence } from '@/cockpits/coder/CoderBridgeData'
import { JourneyMapView } from '@/components/JourneyMapView'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

export const JourneysSection = () => {
  const { repoId = 'local' } = useParams()
  const { loading, memory } = useRepoIntelligence(repoId)

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>
  if (!memory) return <EmptyState title="No journey data" description="Run mnemos build on this repository first." className="m-8" />

  return (
    <div className="p-6">
      <JourneyMapView journeys={memory.journeys ?? []} flows={memory.flows} />
    </div>
  )
}
