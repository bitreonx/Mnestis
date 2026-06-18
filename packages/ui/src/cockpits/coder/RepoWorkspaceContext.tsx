import { useIntelligence, type IntelligenceState } from '@/core/IntelligenceProvider'

/** @deprecated Use useIntelligence from @/core/IntelligenceProvider */
export type RepoWorkspaceState = IntelligenceState & { focusMode: IntelligenceState['mode'] }

/** @deprecated Use useIntelligence from @/core/IntelligenceProvider */
export const useRepoWorkspace = (): RepoWorkspaceState => {
  const intel = useIntelligence()
  return { ...intel, focusMode: intel.mode }
}

export { IntelligenceProvider as RepoWorkspaceProvider } from '@/core/IntelligenceProvider'
