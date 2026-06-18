import { useState } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportIssueButton } from '@/components/layout/ReportIssueButton'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'mnemos.beta.dismissed'

interface BetaNoticeProps {
  className?: string
  compact?: boolean
}

export const BetaNotice = ({ className, compact }: BetaNoticeProps) => {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DISMISS_KEY) === '1'
  })

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className={cn(
        'glass-panel relative border-[var(--color-accent)]/25 px-4 py-3',
        compact ? 'text-xs' : 'text-sm',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="metallic-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)]">
          <FlaskConical className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--color-fg)]">{t('beta.title')}</p>
          <p className="mt-0.5 leading-relaxed text-[var(--color-fg-muted)]">{t('beta.description')}</p>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">{t('beta.stable')}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ReportIssueButton variant="secondary" size="sm" label={t('beta.report')} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={t('common.close')}
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
