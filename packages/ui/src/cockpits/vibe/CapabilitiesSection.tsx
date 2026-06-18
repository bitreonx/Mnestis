import { Layers } from 'lucide-react'
import { CapabilitiesView } from '@/components/CapabilitiesView'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { PageLayout, PageHeader, LoadingState, EmptyState, ContentWell } from '@/shell/PageLayout'
import { Button } from '@/components/ui/button'

export const CapabilitiesSection = () => {
  const { loading, memory, error, handleBuild, building } = useIntelligence()

  if (loading) return <LoadingState />
  if (!memory) {
    return (
      <PageLayout>
        <EmptyState
          title="No capabilities detected"
          description={error ?? 'Run Mnemos to infer business capabilities.'}
          action={
            <Button onClick={handleBuild} disabled={building}>
              {building ? 'Building…' : 'Run Mnemos'}
            </Button>
          }
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout wide>
      <PageHeader
        title="Capabilities"
        description="What this product can do — inferred from code structure, APIs, and domain boundaries."
        icon={<Layers className="h-6 w-6" />}
      />
      <ContentWell>
        <CapabilitiesView memory={memory} />
      </ContentWell>
    </PageLayout>
  )
}
