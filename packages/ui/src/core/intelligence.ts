import type {
  GraphData,
  HealthScore,
  HeatmapEntry,
  MemoryModel,
  Smell,
} from '@/types'
import type { BuildHistoryEntry } from '@/lib/workspace'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface DomainRisk {
  id: string
  name: string
  score: number
  risk: RiskLevel
  smellCount: number
  nodeCount: number
  criticalPaths: number
}

export interface FlowRank {
  id: string
  name: string
  centrality: number
  stepCount: number
  type: string
  entryPoint: string
}

export interface SmellCluster {
  type: string
  count: number
  maxSeverity: RiskLevel
  items: Smell[]
}

export interface RepositoryPulse {
  health: number | null
  aiReadiness: number | null
  files: number
  domains: number
  flows: number
  smells: number
  criticalPaths: number
  capabilities: number
  builtAt: string | null
  healthDelta: number | null
}

export interface DimensionInsight {
  name: string
  value: number
  rank: number
}

const severityWeight: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }

export const scoreNarrative = (score: number): string => {
  if (score >= 85) return 'Excellent — humans and AI can navigate confidently.'
  if (score >= 70) return 'Strong foundation with minor gaps to address.'
  if (score >= 55) return 'Usable, but blind spots increase change risk.'
  if (score >= 40) return 'Structural debt is slowing safe iteration.'
  return 'Needs attention before humans or AI can move safely.'
}

export const toneForScore = (score: number): 'great' | 'good' | 'warn' | 'bad' => {
  if (score >= 80) return 'great'
  if (score >= 60) return 'good'
  if (score >= 40) return 'warn'
  return 'bad'
}

export const computeHealthDelta = (history: BuildHistoryEntry[]): number | null => {
  if (history.length < 2) return null
  const sorted = [...history].sort(
    (a, b) => new Date(b.builtAt).getTime() - new Date(a.builtAt).getTime(),
  )
  return sorted[0].health - sorted[1].health
}

export const computeRepositoryPulse = (
  memory: MemoryModel | null,
  healthScore: HealthScore | null,
  aiReadiness: number | null,
  history: BuildHistoryEntry[],
): RepositoryPulse => ({
  health: healthScore?.overall ?? null,
  aiReadiness,
  files: memory?.stats.filesScanned ?? 0,
  domains: memory?.domains.length ?? 0,
  flows: memory?.flows.length ?? 0,
  smells: memory?.smells.length ?? 0,
  criticalPaths: memory?.criticalPaths.length ?? 0,
  capabilities: memory?.capabilities?.length ?? 0,
  builtAt: memory?.builtAt ?? null,
  healthDelta: computeHealthDelta(history),
})

export const computeDomainRisks = (
  memory: MemoryModel,
  heatmap: HeatmapEntry[] = [],
): DomainRisk[] => {
  const heatByDomain = new Map(
    heatmap.map((h) => [h.domain, severityWeight[h.risk] ?? 0]),
  )

  return memory.domains
    .map((domain) => {
      const domainSmells = memory.smells.filter((s) =>
        s.nodes.some((n) => domain.nodes.includes(n)),
      )
      const criticalCount = memory.criticalPaths.filter((cp) =>
        cp.nodes.some((n) => domain.nodes.includes(n)),
      ).length
      const heatRisk = heatByDomain.get(domain.name) ?? 0
      const smellPenalty = domainSmells.reduce(
        (sum, s) => sum + severityWeight[s.severity] * 8,
        0,
      )
      const criticalPenalty = criticalCount * 12
      const sizeFactor = Math.min(domain.nodes.length * 0.5, 15)
      const raw = 100 - smellPenalty - criticalPenalty - heatRisk * 10 + sizeFactor
      const score = Math.max(0, Math.min(100, Math.round(raw)))
      const risk: RiskLevel = score >= 70 ? 'low' : score >= 45 ? 'medium' : 'high'

      return {
        id: domain.id,
        name: domain.name,
        score,
        risk,
        smellCount: domainSmells.length,
        nodeCount: domain.nodes.length,
        criticalPaths: criticalCount,
      }
    })
    .sort((a, b) => a.score - b.score)
}

export const rankFlowsByCentrality = (memory: MemoryModel): FlowRank[] =>
  memory.flows
    .map((flow) => {
      const stepBonus = Math.min(flow.steps.length * 3, 30)
      const confidenceBonus = flow.confidence * 20
      const typeBonus = flow.type === 'http' || flow.type === 'api' ? 15 : 5
      const centrality = Math.round(stepBonus + confidenceBonus + typeBonus)

      return {
        id: flow.id,
        name: flow.name,
        centrality,
        stepCount: flow.steps.length,
        type: flow.type,
        entryPoint: flow.entryPoint,
      }
    })
    .sort((a, b) => b.centrality - a.centrality)

export const clusterSmells = (smells: Smell[]): SmellCluster[] => {
  const map = new Map<string, Smell[]>()
  for (const smell of smells) {
    const list = map.get(smell.type) ?? []
    list.push(smell)
    map.set(smell.type, list)
  }

  return [...map.entries()]
    .map(([type, items]) => {
      const maxSev = items.reduce<RiskLevel>(
        (max, s) => (severityWeight[s.severity] > severityWeight[max] ? s.severity : max),
        'low',
      )
      return { type, count: items.length, maxSeverity: maxSev, items }
    })
    .sort((a, b) => severityWeight[b.maxSeverity] - severityWeight[a.maxSeverity] || b.count - a.count)
}

export const rankDimensions = (
  dimensions: { name: string; value: number }[],
): { strongest: DimensionInsight | null; weakest: DimensionInsight | null } => {
  if (dimensions.length === 0) return { strongest: null, weakest: null }
  const sorted = [...dimensions].sort((a, b) => b.value - a.value)
  return {
    strongest: { ...sorted[0], rank: 1 },
    weakest: { ...sorted[sorted.length - 1], rank: sorted.length },
  }
}

export const computeGraphDensity = (graph: GraphData | null): number | null => {
  if (!graph?.nodes?.length) return null
  const n = graph.nodes.length
  const e = graph.edges?.length ?? 0
  const maxEdges = n * (n - 1)
  if (maxEdges === 0) return 0
  return Math.round((e / maxEdges) * 100)
}

export const topCapabilities = (memory: MemoryModel, limit = 5) =>
  [...(memory.capabilities ?? [])]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)

export const topJourneys = (memory: MemoryModel, limit = 5) =>
  [...(memory.journeys ?? [])].slice(0, limit)
