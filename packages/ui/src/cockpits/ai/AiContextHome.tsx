import { Link, useParams } from 'react-router-dom'
import { Bot, FileJson, Globe, Server, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buildModePath } from '@/lib/mode'
import { PageLayout, PageHeader } from '@/shell/PageLayout'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { StatTile } from '@/components/viz'

const FEED_METHODS = [
  {
    icon: FileJson,
    title: 'project.dna.json',
    description: 'Compressed repository DNA written to .mentis/ after every build.',
    action: 'Open DNA file',
    resolve: (repoId: string) =>
      repoId === 'local' ? '/.mentis/project.dna.json' : `/.mentis/${repoId}/project.dna.json`,
    external: true,
  },
  {
    icon: Server,
    title: 'mnemos serve',
    description: 'HTTP endpoint for live agent queries without opening the dashboard.',
    action: 'GET /copilot/pack',
    resolve: (repoId: string) => `http://localhost:4000/copilot/pack/${repoId}`,
    external: true,
  },
  {
    icon: Globe,
    title: 'AI Pack JSON',
    description: 'Browser view with syntax highlighting and one-click copy.',
    action: 'Open JSON view',
    resolve: (repoId: string) => `/json/${repoId}`,
    external: false,
  },
  {
    icon: Bot,
    title: 'Repair prompts',
    description: 'Pre-built fix prompts and issue cards for Claude, Cursor, Trae.',
    action: 'Open repairs',
    resolve: (repoId: string) => buildModePath('ai', repoId, 'repairs'),
    external: false,
  },
] as const

export const AiContextHome = () => {
  const { repoId = 'local' } = useParams()
  const { pulse, packIssues, suggestedPrompts } = useIntelligence()

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Agent context"
        title="AI Pack v1 — feed any agent"
        description="Claude, Cursor, Trae, and Codex can reason about your repo from structured Mnemos output — no dashboard required."
        icon={<Bot className="h-6 w-6" />}
        actions={
          <Link to={buildModePath('ai', repoId, 'json')}>
            <Button size="sm">
              Open full pack
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <StatTile label="AI readiness" value={pulse.aiReadiness ?? 0} unit="/100" />
        <StatTile label="Open issues" value={packIssues.length} />
        <StatTile label="Prompt seeds" value={suggestedPrompts.length} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEED_METHODS.map(({ icon: Icon, title, description, action, resolve, external }) => {
          const href = resolve(repoId)
          return (
            <Card key={title} className="group transition-shadow hover:shadow-[var(--shadow-glow)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="metallic-ring flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)]">
                    <Icon className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
                  </span>
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                {external ? (
                  <Button variant="secondary" size="sm" onClick={() => window.open(href, '_blank')}>
                    {action}
                  </Button>
                ) : (
                  <Link to={href}>
                    <Button variant="secondary" size="sm">
                      {action}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageLayout>
  )
}
