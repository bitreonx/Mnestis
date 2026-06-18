import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/shell/AppShell'
import { AiContextHome } from '@/cockpits/ai/AiContextHome'
import { JsonPackSection } from '@/cockpits/ai/JsonPackSection'
import { RepairsSection } from '@/cockpits/ai/RepairsSection'
import { VerifySection } from '@/cockpits/ai/VerifySection'

const SECTION_MAP: Record<string, React.ComponentType> = {
  home: AiContextHome,
  json: JsonPackSection,
  repairs: RepairsSection,
  verify: VerifySection,
}

export const AiCockpit = () => {
  const { section = 'home', repoId = 'local' } = useParams()

  if (!SECTION_MAP[section]) {
    return <Navigate to={`/ai/${repoId}/home`} replace />
  }

  const Section = SECTION_MAP[section]

  return (
    <AppShell mode="ai">
      <Section />
    </AppShell>
  )
}

export const AiCockpitRedirect = () => {
  const { repoId = 'local' } = useParams()
  return <Navigate to={`/ai/${repoId}/home`} replace />
}
