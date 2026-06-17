import { Navigate, useParams } from 'react-router-dom'
import { ModeLayout } from '@/layouts/ModeLayout'
import { CockpitSectionNav } from '@/cockpits/shared/CockpitSectionNav'
import { VibeWorkspaceHeader } from '@/cockpits/vibe/VibeWorkspaceHeader'
import { StorySection } from '@/cockpits/vibe/StorySection'
import { JourneysSection } from '@/cockpits/vibe/JourneysSection'
import { CapabilitiesSection } from '@/cockpits/vibe/CapabilitiesSection'
import { HealthGlanceSection } from '@/cockpits/vibe/HealthGlanceSection'
import { ShareSection } from '@/cockpits/vibe/ShareSection'

const SECTION_MAP: Record<string, React.ComponentType> = {
  story: StorySection,
  journeys: JourneysSection,
  capabilities: CapabilitiesSection,
  health: HealthGlanceSection,
  share: ShareSection,
}

export const VibeCockpit = () => {
  const { section = 'story' } = useParams()
  const Section = SECTION_MAP[section] ?? StorySection

  return (
    <ModeLayout mode="vibe">
      <VibeWorkspaceHeader />
      <CockpitSectionNav mode="vibe" />
      <Section />
    </ModeLayout>
  )
}

export const VibeCockpitRedirect = () => {
  const { repoId = 'local' } = useParams()
  return <Navigate to={`/vibe/${repoId}/story`} replace />
}
