import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildModePath, getStoredRepoId } from '@/lib/mode'

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return

      const repoId = getStoredRepoId() ?? 'local'

      if (e.key === '1' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        navigate(buildModePath('vibe', repoId))
      }
      if (e.key === '2' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        navigate(buildModePath('ai', repoId))
      }
      if (e.key === '3' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        navigate(buildModePath('coder', repoId))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
