import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { GraphData, HealthScore, HeatmapEntry, MemoryModel } from '@/types'
import type { BuildHistoryEntry, RepoSnapshot } from '@/lib/workspace'
import { fetchBuildHistory, fetchRepoMemory, triggerBuild } from '@/lib/workspace'
import { fetchAiPack, fetchAiPackParsed } from '@/lib/ai-pack-client'
import type { AiPackIssue } from '@/lib/ai-pack-client'
import type { FocusMode } from '@/dashboard'
import type { ScoreDimension, ScoreFactor } from '@/cockpits/shared/ScoreExplainer'
import type { ArchSubView, AISubView, CodeSubView, HistorySubView } from '@/components/RepoWorkspace'

export interface RepoWorkspaceState {
  repo: RepoSnapshot
  focusMode: FocusMode
  loading: boolean
  building: boolean
  memory: MemoryModel | null
  graph: GraphData | null
  healthScore: HealthScore | null
  heatmap: HeatmapEntry[]
  history: BuildHistoryEntry[]
  suggestedPrompts: string[]
  dna: Record<string, unknown> | null
  agentPackJson: string
  fixPrompt: string
  packIssues: AiPackIssue[]
  packScore: {
    aiReadinessOverall?: number
    narrative?: string
    factors: ScoreFactor[]
    aiDimensions: ScoreDimension[]
  }
  archView: ArchSubView
  setArchView: (v: ArchSubView) => void
  codeView: CodeSubView
  setCodeView: (v: CodeSubView) => void
  historyView: HistorySubView
  setHistoryView: (v: HistorySubView) => void
  aiView: AISubView
  setAiView: (v: AISubView) => void
  selectedDomain: string | null
  setSelectedDomain: (v: string | null) => void
  insightTarget: string | null
  setInsightTarget: (v: string | null) => void
  contextDoc: string
  setContextDoc: (v: string) => void
  contextContent: string
  copilotSeed: string | null
  setCopilotSeed: (v: string | null) => void
  handleBuild: () => Promise<void>
  reload: () => Promise<void>
}

const Ctx = createContext<RepoWorkspaceState | null>(null)

export const useRepoWorkspace = (): RepoWorkspaceState => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRepoWorkspace must be used within RepoWorkspaceProvider')
  return ctx
}

interface RepoWorkspaceProviderProps {
  repo: RepoSnapshot
  focusMode: FocusMode
  onRefresh?: () => void
  children: ReactNode
}

export const RepoWorkspaceProvider = ({ repo, focusMode, onRefresh, children }: RepoWorkspaceProviderProps) => {
  const [archView, setArchView] = useState<ArchSubView>('systems')
  const [codeView, setCodeView] = useState<CodeSubView>('map')
  const [historyView, setHistoryView] = useState<HistorySubView>('builds')
  const [aiView, setAiView] = useState<AISubView>('copilot')
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [memory, setMemory] = useState<MemoryModel | null>(null)
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([])
  const [history, setHistory] = useState<BuildHistoryEntry[]>([])
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [dna, setDna] = useState<Record<string, unknown> | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [insightTarget, setInsightTarget] = useState<string | null>(null)
  const [contextDoc, setContextDoc] = useState('architecture.md')
  const [contextContent, setContextContent] = useState('')
  const [copilotSeed, setCopilotSeed] = useState<string | null>(null)
  const [agentPackJson, setAgentPackJson] = useState('{}')
  const [fixPrompt, setFixPrompt] = useState('')
  const [packIssues, setPackIssues] = useState<AiPackIssue[]>([])
  const [packScore, setPackScore] = useState<RepoWorkspaceState['packScore']>({
    factors: [],
    aiDimensions: [],
  })

  const reload = async () => {
    setLoading(true)
    try {
      const [data, hist] = await Promise.all([fetchRepoMemory(repo.id), fetchBuildHistory(repo.id)])
      setMemory(data.memory)
      setGraph(data.graph)
      setHealthScore(data.healthScore)
      setHeatmap(data.heatmap)
      setSuggestedPrompts(data.suggestedPrompts)
      setDna(data.dna)
      setHistory(hist)
    } catch {
      setMemory(null)
      setGraph(null)
      setHealthScore(null)
      setHeatmap([])
      setSuggestedPrompts([])
      setDna(null)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [repo.id])

  useEffect(() => {
    if (!memory) return
    fetchAiPack(repo.id, { section: 'all', mode: focusMode })
      .then((json) => {
        setAgentPackJson(json)
        try {
          const pack = JSON.parse(json) as { prompts?: { fix?: string } }
          setFixPrompt(pack.prompts?.fix ?? '')
        } catch {
          setFixPrompt('')
        }
      })
      .catch(() => {
        setAgentPackJson('{}')
        setFixPrompt('')
      })
    fetchAiPackParsed(repo.id, { section: 'issues', mode: focusMode })
      .then((pack) => setPackIssues(pack.issues?.slice(0, 6) ?? []))
      .catch(() => setPackIssues([]))
    fetchAiPackParsed(repo.id, { section: 'score', mode: focusMode })
      .then((raw) => {
        const pack = raw as {
          score?: {
            aiReadinessOverall?: number
            narrative?: string
            factors?: ScoreFactor[]
            aiReadiness?: Record<string, { value: number; definition: string }>
          }
        }
        const aiDimensions = pack.score?.aiReadiness
          ? Object.entries(pack.score.aiReadiness).map(([name, dim]) => ({
              name: name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
              value: dim.value,
              definition: dim.definition,
            }))
          : []
        setPackScore({
          aiReadinessOverall: pack.score?.aiReadinessOverall,
          narrative: pack.score?.narrative,
          factors: pack.score?.factors ?? [],
          aiDimensions,
        })
      })
      .catch(() => setPackScore({ factors: [], aiDimensions: [] }))
  }, [repo.id, focusMode, memory?.builtAt])

  useEffect(() => {
    if (aiView !== 'docs') return
    const base = repo.id === 'local' ? '/.mnemos/context' : `/.mnemos/${repo.id}/context`
    fetch(`${base}/${contextDoc}`)
      .then((r) => (r.ok ? r.text() : 'Document not found'))
      .then(setContextContent)
      .catch(() => setContextContent('Failed to load document'))
  }, [aiView, contextDoc, repo.id])

  useEffect(() => {
    const handler = (e: Event) => {
      const target = (e as CustomEvent<string>).detail
      if (target) setInsightTarget(target)
    }
    window.addEventListener('mnemos:quick-insight', handler)
    return () => window.removeEventListener('mnemos:quick-insight', handler)
  }, [])

  const handleBuild = async () => {
    setBuilding(true)
    await triggerBuild(repo.id)
    setTimeout(async () => {
      await reload()
      onRefresh?.()
      setBuilding(false)
    }, 3000)
  }

  const value: RepoWorkspaceState = {
    repo,
    focusMode,
    loading,
    building,
    memory,
    graph,
    healthScore,
    heatmap,
    history,
    suggestedPrompts,
    dna,
    agentPackJson,
    fixPrompt,
    packIssues,
    packScore,
    archView,
    setArchView,
    codeView,
    setCodeView,
    historyView,
    setHistoryView,
    aiView,
    setAiView,
    selectedDomain,
    setSelectedDomain,
    insightTarget,
    setInsightTarget,
    contextDoc,
    setContextDoc,
    contextContent,
    copilotSeed,
    setCopilotSeed,
    handleBuild,
    reload,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
