import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/shell/AppShell'
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
  const { section = 'story', repoId = 'local' } = useParams()

  if (!SECTION_MAP[section]) {
    return <Navigate to={`/vibe/${repoId}/story`} replace />
  }

  const Section = SECTION_MAP[section]

  return (
    <AppShell mode="vibe">
      <Section />
    </AppShell>
  )
}

export const VibeCockpitRedirect = () => {
  const { repoId = 'local' } = useParams()
  return <Navigate to={`/vibe/${repoId}/story`} replace />
}
