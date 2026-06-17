import type { FocusMode } from '@/dashboard'

const MODE_KEY = 'mnemos.mode'
const REPO_KEY = 'mnemos.lastRepo'
const SECTION_KEY = 'mnemos.lastSection'

export type MnemosMode = FocusMode

export const getStoredMode = (): MnemosMode => {
  if (typeof window === 'undefined') return 'coder'
  const stored = localStorage.getItem(MODE_KEY)
  if (stored === 'vibe' || stored === 'ai' || stored === 'coder') return stored
  return 'coder'
}

export const setStoredMode = (mode: MnemosMode) => {
  localStorage.setItem(MODE_KEY, mode)
}

export const getStoredRepoId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REPO_KEY)
}

export const setStoredRepoId = (repoId: string) => {
  localStorage.setItem(REPO_KEY, repoId)
}

export const getStoredSection = (): string => {
  if (typeof window === 'undefined') return 'overview'
  return localStorage.getItem(SECTION_KEY) ?? 'overview'
}

export const setStoredSection = (section: string) => {
  localStorage.setItem(SECTION_KEY, section)
}

export const modeDefaultSection: Record<MnemosMode, string> = {
  vibe: 'story',
  ai: 'home',
  coder: 'overview',
}

export const buildModePath = (mode: MnemosMode, repoId: string, section?: string) => {
  const sec = section ?? modeDefaultSection[mode]
  return `/${mode}/${repoId}/${sec}`
}

export const parseModeFromPath = (pathname: string): MnemosMode | null => {
  const match = pathname.match(/^\/(vibe|ai|coder)\//)
  return match ? (match[1] as MnemosMode) : null
}
