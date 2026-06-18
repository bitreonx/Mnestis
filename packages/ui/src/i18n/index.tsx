import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import en from './locales/en.json'
import ar from './locales/ar.json'

/**
 * Lightweight i18n for Mnemos — no runtime dependency.
 *
 * Locale files are nested JSON, looked up by dot-path (`t('shell.refresh')`).
 * Missing keys fall back to English, then to the raw key (surfaced in dev so
 * gaps are obvious). `{var}` placeholders are interpolated from `vars`.
 *
 * `setLang` persists the choice (key mirrors lib/mode.ts) and sets
 * `<html lang dir>` so the whole tree mirrors for Arabic via logical CSS utils.
 * Technical terms (API, JSON, commit, flow, endpoint…) are kept verbatim inside
 * the Arabic strings per the product decision — there is no separate machinery
 * for that; translators simply leave those words in English.
 */

export type Lang = 'en' | 'ar'
export type Dir = 'ltr' | 'rtl'

export const LANG_KEY = 'mnemos.lang'

type Messages = Record<string, unknown>
const LOCALES: Record<Lang, Messages> = { en, ar }

const isBrowser = typeof window !== 'undefined'

export const getStoredLang = (): Lang => {
  if (!isBrowser) return 'en'
  return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en'
}

export const dirForLang = (lang: Lang): Dir => (lang === 'ar' ? 'rtl' : 'ltr')

const lookup = (messages: Messages, key: string): string | undefined => {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, messages)
  return typeof value === 'string' ? value : undefined
}

const interpolate = (template: string, vars?: Record<string, string | number>): string => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string

interface I18nContextValue {
  lang: Lang
  dir: Dir
  t: TFn
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getStoredLang)

  const applyLang = useCallback((next: Lang) => {
    if (!isBrowser) return
    document.documentElement.setAttribute('lang', next)
    document.documentElement.setAttribute('dir', dirForLang(next))
  }, [])

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next)
      if (isBrowser) localStorage.setItem(LANG_KEY, next)
      applyLang(next)
    },
    [applyLang],
  )

  const toggleLang = useCallback(() => setLang(lang === 'en' ? 'ar' : 'en'), [lang, setLang])

  const t = useCallback<TFn>(
    (key, vars) => {
      const resolved = lookup(LOCALES[lang], key) ?? lookup(LOCALES.en, key)
      if (resolved === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`)
        return key
      }
      return interpolate(resolved, vars)
    },
    [lang],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir: dirForLang(lang), t, setLang, toggleLang }),
    [lang, t, setLang, toggleLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
