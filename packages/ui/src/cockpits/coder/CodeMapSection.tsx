import { RepositoryExplorer } from '@/components/RepositoryExplorer'
import { TechStackView } from '@/components/TechStackView'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import { CoderWorkspaceLoading } from '@/cockpits/coder/CoderWorkspaceHeader'

export const CodeMapSection = () => {
  const { loading, memory, codeView, setCodeView, setInsightTarget } = useRepoWorkspace()
  if (loading || !memory) return <CoderWorkspaceLoading />

  return (
    <div className="repo-workspace-body">
      <div className="repo-sub-layout">
        <aside className="repo-sub-nav">
          <button type="button" className={codeView === 'map' ? 'active' : ''} onClick={() => setCodeView('map')}>File Map</button>
          <button type="button" className={codeView === 'stack' ? 'active' : ''} onClick={() => setCodeView('stack')}>Tech Stack</button>
        </aside>
        <div className="repo-sub-content">
          {codeView === 'map' ? (
            <RepositoryExplorer memory={memory} onSelectRepo={() => {}} onQuickInsight={setInsightTarget} />
          ) : (
            <TechStackView memory={memory} />
          )}
        </div>
      </div>
    </div>
  )
}
