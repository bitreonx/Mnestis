import { useNavigate } from 'react-router-dom'
import { Sparkles, Bot, Code2, ArrowRight, Zap } from 'lucide-react'
import { FOCUS_MODE_META, type FocusMode } from '@/dashboard'
import { buildModePath, getStoredRepoId, setStoredMode } from '@/lib/mode'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'
import { Legend } from '@/cockpits/shared/Legend'
import { BetaNotice } from '@/components/layout/BetaNotice'
import { cn } from '@/lib/utils'

const ONBOARDED_KEY = 'mnemos.onboarded'

const MODES: { mode: FocusMode; icon: typeof Sparkles }[] = [
  { mode: 'vibe', icon: Sparkles },
  { mode: 'ai', icon: Bot },
  { mode: 'coder', icon: Code2 },
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <div className="ambient-mesh pointer-events-none absolute inset-0" aria-hidden />

      <div className="glass-panel glass-panel--elevated relative z-10 flex flex-col items-center gap-4 px-8 py-6 text-center">
        <MnemosLogo size={72} />
        <div className="metallic-ring flex items-center gap-2 rounded-full px-3 py-1 text-xs text-[var(--color-fg-muted)]">
          <Zap className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Repository intelligence cockpit
        </div>
        <h1 className="max-w-lg text-3xl font-bold tracking-tight md:text-4xl">
          What lens do you need today?
        </h1>
        <p className="max-w-md text-sm text-[var(--color-fg-muted)]">
          Same Mnemos analysis — three perspectives. Pick how you want to explore your codebase.
        </p>
        <Legend active="dashboard" repoId={repoId} />
      </div>

      <div className="relative z-10 mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {MODES.map(({ mode, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleSelect(mode)}
            className={cn(
              'glass-panel glass-glow group relative flex flex-col p-6 text-left transition-all',
              'hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
            )}
          >
            <div className="relative">
              <div className="metallic-ring mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold">{FOCUS_MODE_META[mode].shortLabel}</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-fg)]">{FOCUS_MODE_META[mode].title}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-fg-muted)]">
                {FOCUS_MODE_META[mode].description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
                Enter cockpit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-8 w-full max-w-4xl px-2">
        <BetaNotice />
      </div>

      <p className="relative z-10 mt-10 text-xs text-[var(--color-muted)]">
        Press <kbd className="glass-panel rounded px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd> anywhere to jump · CLI & report are stable
      </p>
    </div>
  )
}

export const shouldShowModePicker = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDED_KEY) !== '1'
}
