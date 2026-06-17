import { useState } from 'react'
import { Construction, Github, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'mnemos.dashboard-preview-dismissed'

export const DashboardPreviewBanner = ({ className }: { className?: string }) => {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DISMISS_KEY) === '1'
  })

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 items-start gap-3 border-b border-amber-500/25 bg-amber-500/8 px-4 py-2.5 text-sm text-[var(--color-fg)]',
        className,
      )}
    >
      <Construction className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p>
          <strong className="font-semibold">Dashboard preview</strong>
          {' — '}
          This interactive UI is under active development. Panels, scrolling, and dark mode are still being polished.
        </p>
        <p className="text-[var(--color-fg-muted)]">
          The <strong className="font-medium text-[var(--color-fg)]">HTML report</strong> and{' '}
          <strong className="font-medium text-[var(--color-fg)]">CLI</strong> are the stable surfaces today — use{' '}
          <code className="rounded bg-[var(--color-surface-2)] px-1 font-mono text-xs">mnemos report --open</code> for
          shareable output. We welcome community help improving the dashboard.
        </p>
        <a
          href="https://github.com/bitreonx/mnemos/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          <Github className="h-3.5 w-3.5" aria-hidden />
          Contribute on GitHub
        </a>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label="Dismiss dashboard preview notice"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
