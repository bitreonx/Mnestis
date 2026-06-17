import { useParams } from 'react-router-dom'
import { useRepoIntelligence } from '@/cockpits/coder/CoderBridgeData'
import { CapabilitiesView } from '@/components/CapabilitiesView'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

export const CapabilitiesSection = () => {
  const { repoId = 'local' } = useParams()
  const { loading, memory } = useRepoIntelligence(repoId)

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>
  if (!memory) return <EmptyState title="No capabilities" description="Build the repository to detect product capabilities." className="m-8" />

  return (
    <div className="p-6">
      <CapabilitiesView memory={memory} />
    </div>
  )
}
