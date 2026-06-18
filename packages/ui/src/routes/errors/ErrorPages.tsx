import { isRouteErrorResponse, Link, useLocation, useNavigate, useRouteError } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Copy, Home, RefreshCw, SearchX, Terminal } from 'lucide-react'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { Button } from '@/components/ui/button'
import { ReportIssueButton } from '@/components/layout/ReportIssueButton'
import { buildModePath, getStoredMode, getStoredRepoId } from '@/lib/mode'
import { hintForPath } from '@/routes/errors/notFoundHints'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'

interface ErrorShellProps {
  code: string
  title: string
  description: string
  icon: React.ReactNode
  children?: React.ReactNode
  errorDetail?: string
}

const ErrorShell = ({ code, title, description, icon, children, errorDetail }: ErrorShellProps) => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const mode = getStoredMode()
  const repoId = getStoredRepoId() ?? 'local'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <div className="ambient-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="glass-panel relative z-10 w-full max-w-xl p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] metallic-ring">
            {icon}
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">{code}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">{description}</p>
        </div>
        {children}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <Button onClick={() => navigate(buildModePath(mode, repoId))} size="sm">
            <Home className="h-4 w-4" />
            {t('common.home')}
          </Button>
          <Button onClick={() => window.location.reload()} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
            {t('common.retry')}
          </Button>
          <ReportIssueButton detail={errorDetail ?? description} label={t('beta.report')} />
        </div>
        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          <MnemosLogo size={16} />
          {t('shell.home')}
        </Link>
      </div>
    </div>
  )
}

const SmartNotFoundDetails = () => {
  const location = useLocation()
  const { t } = useI18n()
  const hint = hintForPath(location.pathname)

  if (!hint) return null

  const handleCopy = async (cmd: string) => {
    const ok = await copyText(cmd)
    toast[ok ? 'success' : 'error'](ok ? t('errors.copied') : t('errors.copyFailed'))
  }

  return (
    <div className="mt-6 space-y-4 text-left">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {t('errors.whyTitle')}
        </p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--color-fg-muted)]">
          {hint.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-[var(--color-accent)]">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {hint.commands.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t('errors.tryTitle')}
          </p>
          <ul className="mt-2 space-y-2">
            {hint.commands.map(({ label, cmd }) => (
              <li key={cmd} className="glass-panel flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-muted)]">{label}</p>
                  <code className="font-mono text-xs text-[var(--color-fg)]">{cmd}</code>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(cmd)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hint.openPath && (
        <a
          href={hint.openPath.href}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-fg)] hover:brightness-110"
        >
          <Terminal className="h-4 w-4" />
          {hint.openPath.label}
        </a>
      )}
    </div>
  )
}

export const NotFoundPage = () => {
  const location = useLocation()
  const { t } = useI18n()
  const hint = hintForPath(location.pathname)

  return (
    <ErrorShell
      code="404"
      title={hint?.title ?? t('errors.notFound.title')}
      description={hint?.description ?? t('errors.notFound.description')}
      icon={<SearchX className="h-7 w-7 text-[var(--color-accent)]" />}
      errorDetail={`404 at ${location.pathname}`}
    >
      <SmartNotFoundDetails />
    </ErrorShell>
  )
}

export const RouteErrorPage = () => {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useI18n()

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFoundPage />
    return (
      <ErrorShell
        code={String(error.status)}
        title={error.statusText || t('errors.unexpected.title')}
        description={typeof error.data === 'string' ? error.data : t('errors.server')}
        icon={<AlertTriangle className="h-7 w-7 text-[var(--color-warn)]" />}
        errorDetail={typeof error.data === 'string' ? error.data : String(error.status)}
      >
        <Button className="mt-4 w-full" size="sm" onClick={() => navigate(0)}>
          {t('common.retry')}
        </Button>
      </ErrorShell>
    )
  }

  const message = error instanceof Error ? error.message : t('errors.unexpected.description')
  const stack = error instanceof Error ? error.stack : undefined

  return (
    <ErrorShell
      code={t('errors.unexpected.code')}
      title={t('errors.unexpected.title')}
      description={message}
      icon={<AlertTriangle className="h-7 w-7 text-[var(--color-danger)]" />}
      errorDetail={stack ?? message}
    >
      {stack && import.meta.env.DEV && (
        <pre className="mt-4 max-h-32 overflow-auto rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-left text-[10px] text-[var(--color-fg-muted)]">
          {stack}
        </pre>
      )}
    </ErrorShell>
  )
}
