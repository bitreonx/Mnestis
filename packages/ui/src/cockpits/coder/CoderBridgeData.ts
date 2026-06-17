import { useEffect, useState } from 'react'
import { fetchRepoMemory, fetchWorkspace, type RepoSnapshot } from '@/lib/workspace'
import type { MemoryModel } from '@/types'

const LOCAL_REPO: RepoSnapshot = {
  id: 'local',
  name: 'local',
  label: 'Repository',
  path: '.',
  description: '',
  accent: '#6366f1',
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
            accent: '#6366f1',
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

export const useRepoIntelligence = (repoId: string) => {
  const [loading, setLoading] = useState(true)
  const [memory, setMemory] = useState<MemoryModel | null>(null)
  const [healthScore, setHealthScore] = useState<Awaited<ReturnType<typeof fetchRepoMemory>>['healthScore']>(null)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    fetchRepoMemory(repoId)
      .then((d) => {
        setMemory(d.memory)
        setHealthScore(d.healthScore)
        setSuggestedPrompts(d.suggestedPrompts)
      })
      .catch(() => {
        setMemory(null)
        setHealthScore(null)
        setSuggestedPrompts([])
      })
      .finally(() => setLoading(false))
  }, [repoId])

  return { loading, memory, healthScore, suggestedPrompts }
}
