import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRepoIntelligence } from '@/cockpits/coder/CoderBridgeData'
import { ScoreExplainer, healthScoreToDimensions, type ScoreDimension, type ScoreFactor } from '@/cockpits/shared/ScoreExplainer'
import { fetchAiPackParsed } from '@/lib/ai-pack-client'
import { Skeleton } from '@/components/ui/skeleton'

export const HealthGlanceSection = () => {
  const { repoId = 'local' } = useParams()
  const { loading, healthScore } = useRepoIntelligence(repoId)
  const [aiDims, setAiDims] = useState<ScoreDimension[]>([])
  const [aiOverall, setAiOverall] = useState<number | undefined>()
  const [factors, setFactors] = useState<ScoreFactor[]>([])

  useEffect(() => {
    fetchAiPackParsed(repoId, { section: 'score', mode: 'vibe' })
      .then((pack) => {
        const score = pack as {
          score?: {
            aiReadinessOverall?: number
            aiReadiness?: Record<string, { value: number; definition: string }>
            factors?: ScoreFactor[]
            narrative?: string
          }
        }
        if (score.score?.aiReadinessOverall != null) setAiOverall(score.score.aiReadinessOverall)
        if (score.score?.aiReadiness) {
          setAiDims(
            Object.entries(score.score.aiReadiness).map(([name, dim]) => ({
              name: name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
              value: dim.value,
              definition: dim.definition,
            })),
          )
        }
        setFactors(score.score?.factors ?? [])
      })
      .catch(() => {})
  }, [repoId])

  if (loading || !healthScore) return <div className="p-8"><Skeleton className="h-32 w-full max-w-lg mx-auto" /></div>

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <ScoreExplainer
        overall={healthScore.overall}
        aiReadinessOverall={aiOverall}
        narrative="Repository quality scores — not Claude or Cursor API usage."
        healthDimensions={healthScoreToDimensions(healthScore)}
        aiDimensions={aiDims}
        factors={factors}
      />
    </div>
  )
}
