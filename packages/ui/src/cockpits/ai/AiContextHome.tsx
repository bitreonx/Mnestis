import { Link, useParams } from 'react-router-dom'
import { Bot, FileJson, Globe, Server } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buildModePath } from '@/lib/mode'

const FEED_METHODS = [
  {
    icon: FileJson,
    title: 'project.dna.json',
    description: 'The compressed repository DNA file written to .mnemos/ after every build.',
    action: 'Read .mnemos/project.dna.json',
    href: '/.mnemos/project.dna.json',
    external: true,
  },
  {
    icon: Server,
    title: 'mnemos serve → /copilot/pack',
    description: 'HTTP endpoint for live agent queries without opening the dashboard.',
    action: 'GET /copilot/pack/:repoId',
    href: 'http://localhost:4000/copilot/pack/local',
    external: true,
  },
  {
    icon: Globe,
    title: 'Dashboard /json route',
    description: 'Browser URL with syntax-highlighted AI Pack v1 and one-click copy.',
    action: 'Open AI JSON view',
    href: '/json/local',
    external: false,
  },
  {
    icon: Bot,
    title: 'Copy-paste pack',
    description: 'Copy the full AI Pack v1 JSON or a pre-built repair prompt in one click.',
    action: 'Open JSON Pack section',
    href: '/ai/local/json',
    external: false,
  },
]

export const AiContextHome = () => {
  const { repoId = 'local' } = useParams()

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-bold">AI Pack v1 — feed any agent</h1>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          Claude, Cursor, Trae, and Codex can reason about your repo from structured Mnemos output — no dashboard required.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEED_METHODS.map(({ icon: Icon, title, description, action, href, external }) => {
          const resolved = href.replace('local', repoId)
          return (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                {external ? (
                  <Button variant="secondary" size="sm" onClick={() => window.open(resolved, '_blank')}>
                    {action}
                  </Button>
                ) : (
                  <Link
                    to={resolved.startsWith('/') ? resolved : buildModePath('ai', repoId, 'json')}
                    className="inline-flex h-8 items-center rounded-[var(--radius-xs)] bg-[var(--color-surface-2)] px-3 text-xs font-medium hover:bg-[var(--color-surface-raised)]"
                  >
                    {action}
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
