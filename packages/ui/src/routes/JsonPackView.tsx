import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Copy, Check } from 'lucide-react'
import { Legend } from '@/cockpits/shared/Legend'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { CodeBlock } from '@/components/ui/code-block'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAiPack } from '@/lib/ai-pack-client'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'

export const JsonPackView = () => {
  const { repoId = 'local' } = useParams()
  const [searchParams] = useSearchParams()
  const [json, setJson] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const section = searchParams.get('section') ?? 'all'
  const mode = searchParams.get('mode') ?? 'ai'

  useEffect(() => {
    setLoading(true)
    fetchAiPack(repoId, { section, mode })
      .then(setJson)
      .catch(() => setJson(null))
      .finally(() => setLoading(false))
  }, [repoId, section, mode])

  const handleCopy = async () => {
    if (!json) return
    const ok = await copyText(json)
    if (ok) {
      setCopied(true)
      toast.success('AI Pack v1 copied')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <MnemosLogo size={24} />
        <span className="font-semibold">AI Pack v1</span>
        <span className="text-sm text-[var(--color-fg-muted)]">{repoId}</span>
        <Legend active="json" repoId={repoId} className="ml-auto" />
        <Button onClick={handleCopy} disabled={!json} size="sm">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy AI Pack v1
        </Button>
      </header>
      <main className="p-6">
        {loading ? (
          <Skeleton className="h-[32rem] w-full" />
        ) : json ? (
          <CodeBlock code={json} language="json" copyLabel="Copy AI Pack v1" />
        ) : (
          <p className="text-[var(--color-danger)]">AI Pack unavailable. Run <code>mnemos build</code> then reload.</p>
        )}
      </main>
    </div>
  )
}
