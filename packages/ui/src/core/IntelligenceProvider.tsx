import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { GraphData, HealthScore, HeatmapEntry, MemoryModel } from '@/types'
import type { BuildHistoryEntry, RepoSnapshot } from '@/lib/workspace'
import {
  fetchBuildHistory,
  fetchRepoMemory,
  triggerBuild,
} from '@/lib/workspace'
import { fetchAiPack, fetchAiPackParsed } from '@/lib/ai-pack-client'
import type { AiPackIssue } from '@/lib/ai-pack-client'
import type { FocusMode } from '@/dashboard'
import type { ScoreDimension, ScoreFactor } from '@/cockpits/shared/ScoreExplainer'
import type {
  AISubView,
  ArchSubView,
  CodeSubView,
  HistorySubView,
} from '@/core/navigation'
import {
  clusterSmells,
  computeDomainRisks,
  computeGraphDensity,
  computeRepositoryPulse,
  rankDimensions,
  rankFlowsByCentrality,
  topCapabilities,
  topJourneys,
  type DomainRisk,
  type FlowRank,
  type RepositoryPulse,
  type SmellCluster,
} from '@/core/intelligence'
import { healthScoreToDimensions } from '@/cockpits/shared/ScoreExplainer'

export interface IntelligenceState {
  repo: RepoSnapshot
  mode: FocusMode
  loading: boolean
  building: boolean
  error: string | null
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
  pulse: RepositoryPulse
  domainRisks: DomainRisk[]
  flowRanks: FlowRank[]
  smellClusters: SmellCluster[]
  graphDensity: number | null
  topCaps: ReturnType<typeof topCapabilities>
  topJrns: ReturnType<typeof topJourneys>
  healthInsights: ReturnType<typeof rankDimensions>
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

const Ctx = createContext<IntelligenceState | null>(null)

export const useIntelligence = (): IntelligenceState => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useIntelligence must be used within IntelligenceProvider')
  return ctx
}

interface IntelligenceProviderProps {
  repo: RepoSnapshot
  mode: FocusMode
  children: ReactNode
}

export const IntelligenceProvider = ({ repo, mode, children }: IntelligenceProviderProps) => {
  const [archView, setArchView] = useState<ArchSubView>('systems')
  const [codeView, setCodeView] = useState<CodeSubView>('map')
  const [historyView, setHistoryView] = useState<HistorySubView>('builds')
  const [aiView, setAiView] = useState<AISubView>('copilot')
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  const [packScore, setPackScore] = useState<IntelligenceState['packScore']>({
    factors: [],
    aiDimensions: [],
  })

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, hist] = await Promise.all([
        fetchRepoMemory(repo.id),
        fetchBuildHistory(repo.id),
      ])
      setMemory(data.memory)
      setGraph(data.graph)
      setHealthScore(data.healthScore)
      setHeatmap(data.heatmap)
      setSuggestedPrompts(data.suggestedPrompts)
      setDna(data.dna)
      setHistory(hist)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load repository intelligence')
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
  }, [repo.id])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!memory) return
    fetchAiPack(repo.id, { section: 'all', mode })
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

    fetchAiPackParsed(repo.id, { section: 'issues', mode })
      .then((pack) => setPackIssues(pack.issues?.slice(0, 8) ?? []))
      .catch(() => setPackIssues([]))

    fetchAiPackParsed(repo.id, { section: 'score', mode })
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
  }, [repo.id, mode, memory?.builtAt])

  useEffect(() => {
    if (aiView !== 'docs') return
    const base = repo.id === 'local' ? '/.mentis/context' : `/.mentis/${repo.id}/context`
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
      setBuilding(false)
    }, 3000)
  }

  const derived = useMemo(() => {
    const pulse = computeRepositoryPulse(
      memory,
      healthScore,
      packScore.aiReadinessOverall ?? null,
      history,
    )
    const domainRisks = memory ? computeDomainRisks(memory, heatmap) : []
    const flowRanks = memory ? rankFlowsByCentrality(memory) : []
    const smellClusters = memory ? clusterSmells(memory.smells) : []
    const graphDensity = computeGraphDensity(graph)
    const topCaps = memory ? topCapabilities(memory) : []
    const topJrns = memory ? topJourneys(memory) : []
    const healthInsights = healthScore
      ? rankDimensions(healthScoreToDimensions(healthScore))
      : { strongest: null, weakest: null }

    return {
      pulse,
      domainRisks,
      flowRanks,
      smellClusters,
      graphDensity,
      topCaps,
      topJrns,
      healthInsights,
    }
  }, [memory, healthScore, heatmap, history, graph, packScore.aiReadinessOverall])

  const value: IntelligenceState = {
    repo,
    mode,
    loading,
    building,
    error,
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
    ...derived,
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
