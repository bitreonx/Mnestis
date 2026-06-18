import { Network } from 'lucide-react'
import { ArchitectureCanvas } from '@/components/ArchitectureCanvas'
import { CapabilitiesView } from '@/components/CapabilitiesView'
import { DomainsView } from '@/components/DomainsView'
import { GraphView } from '@/components/GraphView'
import { SmellsView } from '@/components/SmellsView'
import { SystemAnalyzer } from '@/components/SystemAnalyzer'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { ARCH_SUBSECTIONS } from '@/core/navigation'
import { PageLayout, PageHeader, SubNav, LoadingState, ContentWell } from '@/shell/PageLayout'

export const ArchitectureSection = () => {
  const {
    loading,
    memory,
    graph,
    archView,
    setArchView,
    selectedDomain,
    setInsightTarget,
  } = useIntelligence()

  if (loading || !memory) return <LoadingState />

  const highlightNodes = selectedDomain
    ? memory.domains.find((d) => d.id === selectedDomain)?.nodes
    : undefined

  return (
    <PageLayout wide>
      <PageHeader
        title="Architecture"
        description="Systems, domains, dependency graph, and structural smells."
        icon={<Network className="h-6 w-6" />}
      />

      <SubNav
        items={ARCH_SUBSECTIONS}
        value={archView}
        onChange={setArchView}
        ariaLabel="Architecture views"
      />

      <div className="min-h-[480px]">
        <ContentWell className="min-h-[480px]">
        {archView === 'systems' && <SystemAnalyzer memory={memory} onQuickInsight={setInsightTarget} />}
        {archView === 'domains' && <DomainsView domains={memory.domains} selectedId={selectedDomain} />}
        {archView === 'graph' && (
          <div className="h-[560px]">
            <GraphView graph={graph} highlightNodes={highlightNodes} />
          </div>
        )}
        {archView === 'logic' && <CapabilitiesView memory={memory} />}
        {archView === 'canvas' && (
          <div className="h-[560px]">
            <ArchitectureCanvas memory={memory} />
          </div>
        )}
        {archView === 'smells' && <SmellsView smells={memory.smells} />}
        </ContentWell>
      </div>
    </PageLayout>
  )
}
