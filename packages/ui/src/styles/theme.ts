import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Theme management for Mnemos.
 *
 * Three user-facing choices — `light`, `dark`, `system` — persisted to
 * localStorage. The *resolved* theme (always `light` or `dark`) is reflected on
 * `<html data-theme>`, which drives every token in styles/tokens.css.
 *
 * The very first paint is handled by the no-FOUC bootstrap in index.html; this
 * provider takes over on mount and keeps the attribute in sync with the choice
 * and (for `system`) the live OS preference. The localStorage key and reads
 * mirror the lib/mode.ts pattern.
 */

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_KEY = 'mnemos.theme'

const isBrowser = typeof window !== 'undefined'

export const getStoredTheme = (): ThemeChoice => {
  if (!isBrowser) return 'system'
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

export const getSystemTheme = (): ResolvedTheme =>
  isBrowser && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

export const resolveTheme = (choice: ThemeChoice): ResolvedTheme =>
  choice === 'system' ? getSystemTheme() : choice

const applyTheme = (resolved: ResolvedTheme) => {
  if (!isBrowser) return
  document.documentElement.setAttribute('data-theme', resolved)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'light' ? '#ffffff' : '#171717')
}

interface ThemeContextValue {
  theme: ThemeChoice
  resolved: ResolvedTheme
  setTheme: (choice: ThemeChoice) => void
  /** Cycle light → dark → system → light. */
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeChoice>(getStoredTheme)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()))

  const setTheme = useCallback((choice: ThemeChoice) => {
    setThemeState(choice)
    if (isBrowser) localStorage.setItem(THEME_KEY, choice)
    const next = resolveTheme(choice)
    setResolved(next)
    applyTheme(next)
  }, [])

  const cycleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  }, [theme, setTheme])

  // Track the OS preference while the choice is `system`.
  useEffect(() => {
    if (!isBrowser || theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      const next = getSystemTheme()
      setResolved(next)
      applyTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  // Ensure the attribute matches React state on mount (bootstrap already set it).
  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme, cycleTheme }),
    [theme, resolved, setTheme, cycleTheme],
  )

  return createElement(ThemeContext.Provider, { value }, children)
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
