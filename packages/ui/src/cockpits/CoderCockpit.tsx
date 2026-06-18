import { Navigate, useParams } from 'react-router-dom'
import { QuickInsights } from '@/components/QuickInsights'
import { AppShell } from '@/shell/AppShell'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { CoderOverview } from '@/cockpits/coder/CoderOverview'
import { ArchitectureSection } from '@/cockpits/coder/ArchitectureSection'
import { FlowsSection } from '@/cockpits/coder/FlowsSection'
import { CodeMapSection } from '@/cockpits/coder/CodeMapSection'
import { HistorySection } from '@/cockpits/coder/HistorySection'
import { CopilotSection } from '@/cockpits/coder/CopilotSection'

const SECTION_MAP: Record<string, React.ComponentType> = {
  overview: CoderOverview,
  architecture: ArchitectureSection,
  flows: FlowsSection,
  code: CodeMapSection,
  history: HistorySection,
  ai: CopilotSection,
}

const CoderBody = () => {
  const { section = 'overview' } = useParams()
  const { insightTarget, setInsightTarget, memory } = useIntelligence()
  const Section = SECTION_MAP[section] ?? CoderOverview

  return (
    <>
      <Section />
      {insightTarget && memory && (
        <QuickInsights memory={memory} target={insightTarget} onClose={() => setInsightTarget(null)} />
      )}
    </>
  )
}

export const CoderCockpit = () => {
  const { repoId = 'local', section = 'overview' } = useParams()

  if (!SECTION_MAP[section] && section !== 'overview') {
    return <Navigate to={`/coder/${repoId}/overview`} replace />
  }

  return (
    <AppShell mode="coder">
      <CoderBody />
    </AppShell>
  )
}

export const CoderCockpitRedirect = () => {
  const { repoId = 'local' } = useParams()
  return <Navigate to={`/coder/${repoId}/overview`} replace />
}
