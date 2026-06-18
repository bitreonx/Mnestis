import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Copy, Check, FileJson, ArrowLeft, Home } from 'lucide-react'
import { Legend } from '@/cockpits/shared/Legend'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { CodeBlock } from '@/components/ui/code-block'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { fetchAiPack } from '@/lib/ai-pack-client'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import { buildModePath } from '@/lib/mode'
import { BetaNotice } from '@/components/layout/BetaNotice'
import { LoadingState, EmptyState } from '@/shell/PageLayout'

export const JsonPackView = () => {
  const { repoId = 'local' } = useParams()
  const [json, setJson] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchAiPack(repoId, { section: 'all', mode: 'ai' })
      .then(setJson)
      .catch(() => setJson(null))
      .finally(() => setLoading(false))
  }, [repoId])

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
    <div className="relative flex min-h-screen flex-col">
      <div className="ambient-mesh pointer-events-none absolute inset-0" aria-hidden />

      <header className="glass-topbar relative z-10 flex items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Mnemos home">
          <MnemosLogo size={24} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">AI Pack v1</p>
          <p className="truncate text-xs text-[var(--color-muted)]">{repoId}</p>
        </div>
        <Legend active="json" repoId={repoId} />
        <ThemeToggle />
        <Link to={buildModePath('ai', repoId, 'json')}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Button onClick={handleCopy} disabled={!json} size="sm">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy pack
        </Button>
      </header>

      <div className="relative z-10 shrink-0 px-4 pt-3">
        <BetaNotice compact />
      </div>

      <main className="relative z-10 flex-1 p-4 md:p-6">
        {loading ? (
          <LoadingState message="Loading AI Pack…" />
        ) : json ? (
          <div className="glass-content-well mx-auto max-w-5xl overflow-hidden">
            <div className="mb-4 flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-3">
              <FileJson className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="text-sm font-medium">Full AI Pack v1</span>
            </div>
            <div className="p-4">
              <CodeBlock code={json} language="json" copyLabel="Copy AI Pack v1" />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-lg">
            <EmptyState
              title="AI Pack unavailable"
              description="Run mnemos build on this repository, then reload this page."
              action={
                <Link to={buildModePath('coder', repoId, 'overview')}>
                  <Button size="sm">
                    <Home className="h-4 w-4" />
                    Open cockpit
                  </Button>
                </Link>
              }
            />
          </div>
        )}
      </main>
    </div>
  )
}
