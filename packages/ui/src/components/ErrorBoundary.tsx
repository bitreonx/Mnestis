import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { ReportIssueButton } from '@/components/layout/ReportIssueButton'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Mnemos ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const detail = this.state.error?.stack ?? this.state.error?.message

      return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
          <div className="ambient-mesh pointer-events-none absolute inset-0" aria-hidden />
          <div className="glass-panel relative z-10 w-full max-w-lg p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] metallic-ring">
              <AlertTriangle className="h-7 w-7 text-[var(--color-danger)]" />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">Render error</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Something broke in the UI</h1>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
              {this.state.error?.message ?? 'An unexpected rendering error occurred.'}
            </p>
            {import.meta.env.DEV && this.state.error?.stack && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-left text-[10px] text-[var(--color-fg-muted)]">
                {this.state.error.stack}
              </pre>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={this.handleReset} size="sm">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.location.assign('/')}>
                <MnemosLogo size={16} />
                Go home
              </Button>
              <ReportIssueButton detail={detail} />
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
