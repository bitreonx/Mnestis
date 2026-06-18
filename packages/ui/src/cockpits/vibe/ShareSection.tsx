import { Link, useParams } from 'react-router-dom'
import { Copy, ExternalLink, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import { buildModePath } from '@/lib/mode'
import { MNEMOS_REPORT_PATH } from '@/lib/support'
import { PageLayout, PageHeader } from '@/shell/PageLayout'

export const ShareSection = () => {
  const { repoId = 'local' } = useParams()
  const vibeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${buildModePath('vibe', repoId, 'story')}`
      : ''

  const handleCopyLink = async () => {
    const ok = await copyText(vibeUrl)
    toast[ok ? 'success' : 'error'](ok ? 'Link copied' : 'Copy failed')
  }

  return (
    <PageLayout>
      <PageHeader
        title="Share with your team"
        description="Send non-technical teammates the Vibe view or the standalone report — not raw JSON or architecture graphs."
        icon={<Share2 className="h-6 w-6" />}
        actions={
          <>
            <Button onClick={handleCopyLink} variant="secondary" size="sm">
              <Copy className="h-4 w-4" />
              Copy Vibe link
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(MNEMOS_REPORT_PATH, '_blank')}>
              <ExternalLink className="h-4 w-4" />
              Open report
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Three artifacts, three audiences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-4">
            <strong>Dashboard</strong>
            <p className="mt-1 text-[var(--color-fg-muted)]">Interactive exploration for you and your team.</p>
            <Link to={buildModePath('vibe', repoId, 'story')} className="mt-2 inline-block text-[var(--color-accent)] hover:underline">
              You are here
            </Link>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-4">
            <strong>Report</strong>
            <p className="mt-1 text-[var(--color-fg-muted)]">Static HTML for async review and demos.</p>
            <a href={MNEMOS_REPORT_PATH} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[var(--color-accent)] hover:underline">
              Open report
            </a>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-4">
            <strong>AI JSON</strong>
            <p className="mt-1 text-[var(--color-fg-muted)]">Structured pack for Claude, Cursor, Trae.</p>
            <Link to={`/json/${repoId}`} className="mt-2 inline-block text-[var(--color-accent)] hover:underline">
              View AI Pack
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
