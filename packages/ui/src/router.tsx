import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { getStoredMode, getStoredRepoId, buildModePath, modeDefaultSection } from '@/lib/mode'
import { JsonPackView } from '@/routes/JsonPackView'
import { ReportRedirect } from '@/routes/ReportRedirect'
import { ModePicker, shouldShowModePicker } from '@/routes/ModePicker'
import { NotFoundPage, RouteErrorPage } from '@/routes/errors/ErrorPages'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'

const VibeCockpit = lazy(() =>
  import('@/cockpits/VibeCockpit')
    .then((m) => ({ default: m.VibeCockpit }))
    .catch(() => {
      throw new Response('Failed to load Vibe cockpit', { status: 500 })
    }),
)
const AiCockpit = lazy(() =>
  import('@/cockpits/AiCockpit')
    .then((m) => ({ default: m.AiCockpit }))
    .catch(() => {
      throw new Response('Failed to load AI cockpit', { status: 500 })
    }),
)
const CoderCockpit = lazy(() =>
  import('@/cockpits/CoderCockpit')
    .then((m) => ({ default: m.CoderCockpit }))
    .catch(() => {
      throw new Response('Failed to load Coder cockpit', { status: 500 })
    }),
)

const Loading = () => (
  <div className="ambient-mesh relative flex h-screen flex-col items-center justify-center gap-4">
    <div className="glass-panel flex flex-col items-center gap-4 px-10 py-8">
      <MnemosLogo size={56} />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--color-accent)]" />
      <p className="text-sm text-[var(--color-fg-muted)]">Loading Mnemos…</p>
    </div>
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

const ModeRedirect = ({ mode }: { mode: 'vibe' | 'ai' | 'coder' }) => {
  const repoId = getStoredRepoId() ?? 'local'
  return <Navigate to={buildModePath(mode, repoId, modeDefaultSection[mode])} replace />
}

const CockpitDefaultRedirect = ({ mode, section }: { mode: 'vibe' | 'ai' | 'coder'; section: string }) => {
  const { repoId = 'local' } = useParams()
  return <Navigate to={buildModePath(mode, repoId, section)} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'vibe', element: <ModeRedirect mode="vibe" /> },
      { path: 'ai', element: <ModeRedirect mode="ai" /> },
      { path: 'coder', element: <ModeRedirect mode="coder" /> },
      {
        path: 'vibe/:repoId',
        element: <CockpitDefaultRedirect mode="vibe" section="story" />,
      },
      {
        path: 'ai/:repoId',
        element: <CockpitDefaultRedirect mode="ai" section="home" />,
      },
      {
        path: 'coder/:repoId',
        element: <CockpitDefaultRedirect mode="coder" section="overview" />,
      },
      {
        path: 'vibe/:repoId/:section',
        element: (
          <SuspenseWrap>
            <VibeCockpit />
          </SuspenseWrap>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'ai/:repoId/:section',
        element: (
          <SuspenseWrap>
            <AiCockpit />
          </SuspenseWrap>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'coder/:repoId/:section',
        element: (
          <SuspenseWrap>
            <CoderCockpit />
          </SuspenseWrap>
        ),
        errorElement: <RouteErrorPage />,
      },
      {
        path: 'report',
        element: <ReportRedirect />,
      },
      {
        path: 'report/*',
        element: <ReportRedirect />,
      },
      {
        path: 'json/:repoId',
        element: <JsonPackView />,
        errorElement: <RouteErrorPage />,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
