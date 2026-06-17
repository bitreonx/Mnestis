import { FlowsView } from '@/components/DomainsView'
import { JourneyMapView } from '@/components/JourneyMapView'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import { CoderWorkspaceLoading } from '@/cockpits/coder/CoderWorkspaceHeader'

export const FlowsSection = () => {
  const { loading, memory } = useRepoWorkspace()
  if (loading || !memory) return <CoderWorkspaceLoading />

  return (
    <div className="repo-workspace-body">
      <div className="repo-sub-layout">
        <FlowsView flows={memory.flows} />
        <JourneyMapView journeys={memory.journeys ?? []} flows={memory.flows} />
      </div>
    </div>
  )
}
