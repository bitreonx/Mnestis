import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { getStoredMode, getStoredRepoId, buildModePath } from '@/lib/mode'
import { JsonPackView } from '@/routes/JsonPackView'
import { ModePicker, shouldShowModePicker } from '@/routes/ModePicker'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'

const VibeCockpit = lazy(() => import('@/cockpits/VibeCockpit').then((m) => ({ default: m.VibeCockpit })))
const AiCockpit = lazy(() => import('@/cockpits/AiCockpit').then((m) => ({ default: m.AiCockpit })))
const CoderCockpit = lazy(() => import('@/cockpits/CoderCockpit').then((m) => ({ default: m.CoderCockpit })))

const Loading = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
    <MnemosLogo size={56} />
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    <p className="text-sm text-[var(--color-fg-muted)]">Loading Mnemos…</p>
  </div>
)

const SuspenseWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
)

const HomeRedirect = () => {
  if (shouldShowModePicker()) {
    return <ModePicker />
  }
  const mode = getStoredMode()
  const repoId = getStoredRepoId() ?? 'local'
  return <Navigate to={buildModePath(mode, repoId)} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'vibe/:repoId/:section?',
        element: (
          <SuspenseWrap>
            <VibeCockpit />
          </SuspenseWrap>
        ),
      },
      {
        path: 'ai/:repoId/:section?',
        element: (
          <SuspenseWrap>
            <AiCockpit />
          </SuspenseWrap>
        ),
      },
      {
        path: 'coder/:repoId/:section?',
        element: (
          <SuspenseWrap>
            <CoderCockpit />
          </SuspenseWrap>
        ),
      },
      {
        path: 'json/:repoId',
        element: <JsonPackView />,
      },
    ],
  },
])
