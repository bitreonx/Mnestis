import { History } from 'lucide-react'
import { BuildHistoryView } from '@/components/BuildHistoryView'
import { HeatmapView } from '@/components/HeatmapView'
import { TimelineView } from '@/components/TimelineView'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { HISTORY_SUBSECTIONS } from '@/core/navigation'
import { PageLayout, PageHeader, SubNav, LoadingState, ContentWell } from '@/shell/PageLayout'
import { TrendChart } from '@/components/viz'

export const HistorySection = () => {
  const { loading, memory, history, heatmap, historyView, setHistoryView } = useIntelligence()
  if (loading || !memory) return <LoadingState />

  const trendPoints = [...history]
    .sort((a, b) => new Date(a.builtAt).getTime() - new Date(b.builtAt).getTime())
    .map((h) => ({ label: new Date(h.builtAt).toLocaleDateString(), value: h.health }))

  return (
    <PageLayout wide>
      <PageHeader
        title="Build history"
        description="Track health trends, activity timeline, and domain risk hotspots over time."
        icon={<History className="h-6 w-6" />}
      />

      {trendPoints.length > 1 && (
        <div className="glass-panel mb-6 p-4">
          <p className="mb-3 text-sm font-medium">Health trend</p>
          <TrendChart data={trendPoints} height={120} ariaLabel="Health score over builds" />
        </div>
      )}

      <SubNav
        items={HISTORY_SUBSECTIONS}
        value={historyView}
        onChange={setHistoryView}
        ariaLabel="History views"
      />

      <ContentWell className="min-h-[480px]">
        {historyView === 'builds' && <BuildHistoryView history={history} memory={memory} />}
        {historyView === 'timeline' && <TimelineView memory={memory} />}
        {historyView === 'heatmap' && <HeatmapView heatmap={heatmap} />}
      </ContentWell>
    </PageLayout>
  )
}
