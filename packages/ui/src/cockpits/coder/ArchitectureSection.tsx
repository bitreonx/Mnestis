import { ArchitectureCanvas } from '@/components/ArchitectureCanvas'
import { CapabilitiesView } from '@/components/CapabilitiesView'
import { DomainsView } from '@/components/DomainsView'
import { GraphView } from '@/components/GraphView'
import { SmellsView } from '@/components/SmellsView'
import { SystemAnalyzer } from '@/components/SystemAnalyzer'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import { CoderWorkspaceLoading } from '@/cockpits/coder/CoderWorkspaceHeader'

export const ArchitectureSection = () => {
  const {
    loading, memory, graph, archView, setArchView, selectedDomain, setInsightTarget,
  } = useRepoWorkspace()

  if (loading || !memory) return <CoderWorkspaceLoading />

  const highlightNodes = selectedDomain
    ? memory.domains.find((d) => d.id === selectedDomain)?.nodes
    : undefined

  return (
    <div className="repo-workspace-body">
      <div className="repo-sub-layout">
        <aside className="repo-sub-nav">
          {(
            [
              ['systems', 'Systems'],
              ['domains', 'Domains'],
              ['graph', 'Dependency Graph'],
              ['logic', 'Capabilities'],
              ['canvas', 'Canvas'],
              ['smells', 'Smells'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className={archView === id ? 'active' : ''} onClick={() => setArchView(id)}>
              {label}
            </button>
          ))}
        </aside>
        <div className="repo-sub-content">
          {archView === 'systems' && <SystemAnalyzer memory={memory} onQuickInsight={setInsightTarget} />}
          {archView === 'domains' && <DomainsView domains={memory.domains} selectedId={selectedDomain} />}
          {archView === 'graph' && (
            <div className="repo-graph-panel"><GraphView graph={graph} highlightNodes={highlightNodes} /></div>
          )}
          {archView === 'logic' && <CapabilitiesView memory={memory} />}
          {archView === 'canvas' && <div className="h-full"><ArchitectureCanvas memory={memory} /></div>}
          {archView === 'smells' && <SmellsView smells={memory.smells} />}
        </div>
      </div>
    </div>
  )
}
