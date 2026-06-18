import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { type FocusMode } from '@/dashboard'
import { IntelligenceProvider } from '@/core/IntelligenceProvider'
import { useActiveRepo } from '@/cockpits/coder/CoderBridgeData'
import { fetchWorkspace, type RepoSnapshot } from '@/lib/workspace'
import { buildModePath, setStoredMode, setStoredRepoId } from '@/lib/mode'
import { CockpitTerminalPanel } from '@/components/layout/CockpitTerminalPanel'
import { BetaNotice } from '@/components/layout/BetaNotice'
import { Sidebar, TopBar } from '@/shell/Sidebar'
import type { TerminalMode } from '@/components/IntegratedTerminal'

interface AppShellProps {
  mode: FocusMode
  children?: ReactNode
}

const LOCAL_REPO: RepoSnapshot = {
  id: 'local',
  name: 'Repository',
  label: 'Local',
  path: '.',
  description: '',
  accent: '#3ecf8e',
  status: 'missing',
}

export const AppShell = ({ mode, children }: AppShellProps) => {
  const { repoId = 'local', section = 'overview' } = useParams()
  const navigate = useNavigate()
  const repo = useActiveRepo(repoId)
  const [repos, setRepos] = useState<RepoSnapshot[]>([])
  const [workspaceMode, setWorkspaceMode] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)

  useEffect(() => {
    setStoredMode(mode)
    if (repoId) setStoredRepoId(repoId)
  }, [mode, repoId])

  useEffect(() => {
    fetchWorkspace()
      .then((ws) => {
        setWorkspaceMode(true)
        setRepos(ws.repos)
      })
      .catch(() => setWorkspaceMode(false))
  }, [])

  const handleRepoChange = (id: string) => {
    navigate(buildModePath(mode, id, section))
  }

  const activeRepo = repos.find((r) => r.id === repoId) ?? repo ?? { ...LOCAL_REPO, id: repoId }

  return (
    <IntelligenceProvider repo={activeRepo} mode={mode}>
      <div
        className="relative flex h-screen overflow-hidden"
        style={{ '--sidebar-width': '15.5rem' } as React.CSSProperties}
      >
        <div className="ambient-mesh pointer-events-none absolute inset-0" aria-hidden />
        <Sidebar
          mode={mode}
          repoId={repoId}
          section={section}
          workspaceMode={workspaceMode}
          repos={repos.length ? repos : [activeRepo]}
          onRepoChange={handleRepoChange}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar
            mode={mode}
            repoName={activeRepo.name}
            section={section}
            terminalOpen={terminalOpen}
            onToggleTerminal={() => setTerminalOpen((v) => !v)}
          />

          <div className="relative z-10 shrink-0 px-4 pt-3">
            <BetaNotice compact />
          </div>

          <main className="min-h-0 flex-1 overflow-auto" id="mnemos-capture-root">
            {children ?? <Outlet />}
          </main>

          {terminalOpen && (
            <CockpitTerminalPanel
              repoId={repoId}
              repositoryPath={activeRepo.path ?? repoId}
              mode={mode as TerminalMode}
            />
          )}
        </div>
      </div>
    </IntelligenceProvider>
  )
}
