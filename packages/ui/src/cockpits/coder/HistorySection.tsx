import { BuildHistoryView } from '@/components/BuildHistoryView'
import { HeatmapView } from '@/components/HeatmapView'
import { TimelineView } from '@/components/TimelineView'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import { CoderWorkspaceLoading } from '@/cockpits/coder/CoderWorkspaceHeader'

export const HistorySection = () => {
  const { loading, memory, history, heatmap, historyView, setHistoryView } = useRepoWorkspace()
  if (loading || !memory) return <CoderWorkspaceLoading />

  return (
    <div className="repo-workspace-body">
      <div className="repo-sub-layout">
        <aside className="repo-sub-nav">
          <button type="button" className={historyView === 'builds' ? 'active' : ''} onClick={() => setHistoryView('builds')}>Build History</button>
          <button type="button" className={historyView === 'timeline' ? 'active' : ''} onClick={() => setHistoryView('timeline')}>Activity</button>
          <button type="button" className={historyView === 'risk' ? 'active' : ''} onClick={() => setHistoryView('risk')}>Risk Heatmap</button>
        </aside>
        <div className="repo-sub-content">
          {historyView === 'builds' && <BuildHistoryView history={history} memory={memory} />}
          {historyView === 'timeline' && <TimelineView memory={memory} />}
          {historyView === 'risk' && <HeatmapView heatmap={heatmap} />}
        </div>
      </div>
    </div>
  )
}
