import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/ui/code-block'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAiPack } from '@/lib/ai-pack-client'

export const JsonPackSection = () => {
  const { repoId = 'local' } = useParams()
  const [searchParams] = useSearchParams()
  const [json, setJson] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const section = searchParams.get('section') ?? 'all'

  useEffect(() => {
    setLoading(true)
    fetchAiPack(repoId, { section, mode: 'ai' })
      .then((text) => setJson(text))
      .catch(() => setJson(null))
      .finally(() => setLoading(false))
  }, [repoId, section])

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="p-6">
      <Tabs defaultValue={section}>
        <TabsList aria-label="AI Pack sections">
          {['all', 'summary', 'score', 'issues', 'flows', 'smells', 'dna'].map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={section}>
          {json ? (
            <CodeBlock code={json} language="json" copyLabel="Copy AI Pack v1" />
          ) : (
            <p className="text-sm text-[var(--color-danger)]">Failed to load AI Pack. Run mnemos build first.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
