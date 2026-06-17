import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CommandPaletteRouter } from '@/components/layout/CommandPaletteRouter'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export const RootLayout = () => {
  useKeyboardShortcuts()

  useEffect(() => {
    document.documentElement.style.setProperty('--ease-out', 'cubic-bezier(0.2, 0.8, 0.2, 1)')
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton />
      <CommandPaletteRouter />
    </div>
  )
}
