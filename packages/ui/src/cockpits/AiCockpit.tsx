import { Navigate, useParams } from 'react-router-dom'
import { ModeLayout } from '@/layouts/ModeLayout'
import { CockpitSectionNav } from '@/cockpits/shared/CockpitSectionNav'
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
  const { section = 'home' } = useParams()
  const Section = SECTION_MAP[section] ?? AiContextHome

  return (
    <ModeLayout mode="ai">
      <CockpitSectionNav mode="ai" />
      <Section />
    </ModeLayout>
  )
}

export const AiCockpitRedirect = () => {
  const { repoId = 'local' } = useParams()
  return <Navigate to={`/ai/${repoId}/home`} replace />
}
