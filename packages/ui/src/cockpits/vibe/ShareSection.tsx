import { Link, useParams } from 'react-router-dom'
import { Copy, ExternalLink, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import { buildModePath } from '@/lib/mode'

export const ShareSection = () => {
  const { repoId = 'local' } = useParams()
  const vibeUrl = typeof window !== 'undefined' ? `${window.location.origin}${buildModePath('vibe', repoId, 'story')}` : ''

  const handleCopyLink = async () => {
    const ok = await copyText(vibeUrl)
    toast[ok ? 'success' : 'error'](ok ? 'Link copied' : 'Copy failed')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" aria-hidden />
            Share with your team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-fg-muted)]">
            Send non-technical teammates the Vibe view or the standalone report — not raw JSON or architecture graphs.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopyLink} variant="secondary">
              <Copy className="h-4 w-4" />
              Copy Vibe link
            </Button>
            <Button variant="outline" onClick={() => window.open('/report/index.html', '_blank')}>
              <ExternalLink className="h-4 w-4" />
              Open report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Three artifacts, three audiences</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <strong>Dashboard</strong>
            <p className="text-[var(--color-fg-muted)]">Interactive exploration for you and your team.</p>
            <Link to={buildModePath('vibe', repoId, 'story')} className="text-[var(--color-accent)] hover:underline">You are here</Link>
          </div>
          <div>
            <strong>Report</strong>
            <p className="text-[var(--color-fg-muted)]">Static HTML for async review and demos.</p>
            <a href="/report/index.html" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Open report</a>
          </div>
          <div>
            <strong>AI JSON</strong>
            <p className="text-[var(--color-fg-muted)]">Structured pack for Claude, Cursor, Trae.</p>
            <Link to={`/json/${repoId}`} className="text-[var(--color-accent)] hover:underline">View AI Pack</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
