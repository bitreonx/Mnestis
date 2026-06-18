import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CommandPaletteRouter } from '@/components/layout/CommandPaletteRouter'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTheme } from '@/styles/theme'

const RootShell = () => {
  useKeyboardShortcuts()
  const { resolved } = useTheme()

  return (
    <div className="ambient-mesh min-h-screen text-[var(--color-fg)]">
      <Outlet />
      <Toaster position="bottom-right" theme={resolved} richColors closeButton />
      <CommandPaletteRouter />
    </div>
  )
}

export const RootLayout = () => (
  <ErrorBoundary>
    <RootShell />
  </ErrorBoundary>
)
