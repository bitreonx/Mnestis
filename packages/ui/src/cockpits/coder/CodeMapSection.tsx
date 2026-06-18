import { FolderTree } from 'lucide-react'
import { RepositoryExplorer } from '@/components/RepositoryExplorer'
import { TechStackView } from '@/components/TechStackView'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { CODE_SUBSECTIONS } from '@/core/navigation'
import { PageLayout, PageHeader, SubNav, LoadingState, ContentWell } from '@/shell/PageLayout'

export const CodeMapSection = () => {
  const { loading, memory, codeView, setCodeView, setInsightTarget } = useIntelligence()
  if (loading || !memory) return <LoadingState />

  return (
    <PageLayout wide>
      <PageHeader
        title="Code map"
        description="Inferred file tree and technology stack from repository analysis."
        icon={<FolderTree className="h-6 w-6" />}
      />

      <SubNav
        items={CODE_SUBSECTIONS}
        value={codeView}
        onChange={setCodeView}
        ariaLabel="Code map views"
      />

      <ContentWell className="min-h-[480px]">
        {codeView === 'map' ? (
          <RepositoryExplorer memory={memory} onSelectRepo={() => {}} onQuickInsight={setInsightTarget} />
        ) : (
          <TechStackView memory={memory} />
        )}
      </ContentWell>
    </PageLayout>
  )
}
