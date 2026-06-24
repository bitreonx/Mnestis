import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { FileJson } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/ui/code-block'
import { Button } from '@/components/ui/button'
import { PageLayout, PageHeader, LoadingState, EmptyState } from '@/shell/PageLayout'
import { fetchAiPack } from '@/lib/ai-pack-client'
import { useIntelligence } from '@/core/IntelligenceProvider'

const SECTIONS = ['all', 'summary', 'score', 'issues', 'flows', 'smells', 'dna'] as const

export const JsonPackSection = () => {
  const { repoId = 'local' } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [json, setJson] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleBuild, building } = useIntelligence()
  const section = (searchParams.get('section') ?? 'all') as (typeof SECTIONS)[number]

  useEffect(() => {
    setLoading(true)
    fetchAiPack(repoId, { section, mode: 'ai' })
      .then((text) => setJson(text))
      .catch(() => setJson(null))
      .finally(() => setLoading(false))
  }, [repoId, section])

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('section', value)
    navigate({ search: params.toString() }, { replace: true })
  }

  if (loading) return <LoadingState message="Building AI Pack view…" />

  return (
    <PageLayout wide>
      <PageHeader
        title="JSON Pack"
        description="Full AI Pack v1 payload — copy sections or the entire document for your agent."
        icon={<FileJson className="h-6 w-6" />}
      />

      <Tabs value={section} onValueChange={handleTabChange}>
        <TabsList aria-label="AI Pack sections" className="glass-panel mb-4 flex flex-wrap gap-1 p-1">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={section}>
          {json ? (
            <div className="glass-content-well overflow-hidden">
              <CodeBlock code={json} language="json" copyLabel="Copy AI Pack v1" />
            </div>
          ) : (
            <EmptyState
              title="AI Pack unavailable"
              description="Run mnestis build to generate the AI Pack for this repository."
              action={
                <Button onClick={handleBuild} disabled={building}>
                  {building ? 'Building…' : 'Run Mnemos'}
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
