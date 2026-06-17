import { useNavigate } from 'react-router-dom'
import { Sparkles, Bot, Code2, ArrowRight } from 'lucide-react'
import { FOCUS_MODE_META, type FocusMode } from '@/dashboard'
import { buildModePath, getStoredRepoId, setStoredMode } from '@/lib/mode'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Legend } from '@/cockpits/shared/Legend'

const ONBOARDED_KEY = 'mnemos.onboarded'

const MODES: { mode: FocusMode; icon: typeof Sparkles; action: string }[] = [
  { mode: 'vibe', icon: Sparkles, action: 'Explore product story' },
  { mode: 'ai', icon: Bot, action: 'Hand context to AI' },
  { mode: 'coder', icon: Code2, action: 'Ship code safely' },
]

export const ModePicker = () => {
  const navigate = useNavigate()
  const repoId = getStoredRepoId() ?? 'local'

  const handleSelect = (mode: FocusMode) => {
    setStoredMode(mode)
    localStorage.setItem(ONBOARDED_KEY, '1')
    navigate(buildModePath(mode, repoId))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <MnemosLogo size={64} />
        <h1 className="text-2xl font-bold tracking-tight">What do you want to do today?</h1>
        <p className="max-w-md text-sm text-[var(--color-fg-muted)]">
          Mnemos has three cockpits — same repository intelligence, different lens. The{' '}
          <strong className="font-medium text-[var(--color-fg)]">HTML report</strong> and{' '}
          <strong className="font-medium text-[var(--color-fg)]">CLI</strong> are stable today; the dashboard is in preview.
        </p>
        <Legend active="dashboard" repoId={repoId} />
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {MODES.map(({ mode, icon: Icon, action }) => (
          <Card key={mode} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-5 w-5 text-[var(--color-accent)]" aria-hidden />
                {FOCUS_MODE_META[mode].shortLabel}
              </CardTitle>
              <CardDescription>{FOCUS_MODE_META[mode].title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--color-fg-muted)]">{FOCUS_MODE_META[mode].description}</p>
              <Button className="w-full" onClick={() => handleSelect(mode)}>
                {action}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const shouldShowModePicker = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDED_KEY) !== '1'
}
