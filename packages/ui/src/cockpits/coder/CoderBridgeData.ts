import { useEffect, useState } from 'react'
import { fetchRepoMemory, fetchWorkspace, type RepoSnapshot } from '@/lib/workspace'
import { useIntelligence } from '@/core/IntelligenceProvider'

const LOCAL_REPO: RepoSnapshot = {
  id: 'local',
  name: 'local',
  label: 'Repository',
  path: '.',
  description: '',
  accent: '#3ecf8e',
  status: 'missing',
}

export const useActiveRepo = (repoId: string): RepoSnapshot => {
  const [repo, setRepo] = useState<RepoSnapshot>({ ...LOCAL_REPO, id: repoId, name: repoId })

  useEffect(() => {
    fetchWorkspace()
      .then((ws) => {
        const found = ws.repos.find((r) => r.id === repoId)
        if (found) setRepo(found)
      })
      .catch(async () => {
        try {
          const data = await fetchRepoMemory(repoId)
          const m = data.memory
          setRepo({
            id: repoId,
            name: m.repository,
            label: m.architecture.type,
            path: '.',
            description: m.architecture.summary,
            accent: '#3ecf8e',
            status: m.stats.filesScanned > 0 ? 'ready' : 'missing',
            health: data.healthScore?.overall,
          })
        } catch {
          setRepo({ ...LOCAL_REPO, id: repoId, name: repoId })
        }
      })
  }, [repoId])

  return repo
}

/** @deprecated Use useIntelligence from @/core — only works inside AppShell */
export const useRepoIntelligence = (_repoId: string) => {
  const intel = useIntelligence()
  return {
    loading: intel.loading,
    memory: intel.memory,
    healthScore: intel.healthScore,
    suggestedPrompts: intel.suggestedPrompts,
  }
}
