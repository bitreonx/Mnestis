import { Link, useParams } from 'react-router-dom'
import { Overview } from '@/components/Overview'
import { IssueCard } from '@/components/issues/IssueCard'
import { ScoreExplainer, healthScoreToDimensions } from '@/cockpits/shared/ScoreExplainer'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import { CoderWorkspaceLoading } from '@/cockpits/coder/CoderWorkspaceHeader'
import { copyText } from '@/lib/clipboard'
import { buildModePath } from '@/lib/mode'
import { useState } from 'react'

const scoreNarrative = (score: number) => {
  if (score >= 80) return 'Strong and ready for fast onboarding.'
  if (score >= 60) return 'Usable, with a few blind spots to clean up.'
  if (score >= 40) return 'Understandable, but risky in day-to-day work.'
  return 'Needs attention before humans or AI can move safely.'
}

export const CoderOverview = () => {
  const { repoId = 'local' } = useParams()
  const { loading, memory, healthScore, packIssues, packScore, agentPackJson, fixPrompt, repo } = useRepoWorkspace()
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  if (loading || !memory) return <CoderWorkspaceLoading />

  const handleCopy = async (label: string, text: string) => {
    await copyText(text)
    setCopyFeedback(label)
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  const dims = healthScore ? healthScoreToDimensions(healthScore) : []
  const strongest = dims.length ? dims.reduce((a, b) => (b.value > a.value ? b : a)) : null
  const weakest = dims.length ? dims.reduce((a, b) => (b.value < a.value ? b : a)) : null

  return (
    <div className="repo-workspace repo-workspace--cockpit">
      <div className="repo-workspace-body">
        <div className="repo-tab-panel repo-tab-panel--overview">
          <section className="repo-story-grid">
            <article className="repo-story-card repo-story-card--hero">
              <small>What this repository does</small>
              <h2>{memory.architecture.name || repo.name}</h2>
              <p>{memory.architecture.summary || repo.description}</p>
              <div className="repo-story-pills">
                <span>{memory.domains.length} domains</span>
                <span>{memory.flows.length} flows</span>
                <span>{memory.services.length} services</span>
                <span>{memory.apis.length} APIs</span>
              </div>
            </article>
            <article className="repo-story-card">
              <small>Use the right output</small>
              <h3>Dashboard · Report · AI JSON</h3>
              <div className="repo-mini-list">
                <div><strong>Dashboard</strong><span>Interactive exploration and architecture navigation.</span></div>
                <div><strong>report/index.html</strong><span>Shareable HTML for stakeholders.</span></div>
                <div><strong>AI JSON</strong><span>AI Pack v1 for Claude, Cursor, Trae.</span></div>
              </div>
            </article>
          </section>

          {healthScore && (
            <section className="repo-score-section">
              <ScoreExplainer
                overall={healthScore.overall}
                aiReadinessOverall={packScore.aiReadinessOverall}
                narrative={packScore.narrative ?? scoreNarrative(healthScore.overall)}
                healthDimensions={healthScoreToDimensions(healthScore)}
                aiDimensions={packScore.aiDimensions}
                factors={packScore.factors}
                strongest={strongest ? { name: strongest.name, value: strongest.value } : null}
                weakest={weakest ? { name: weakest.name, value: weakest.value } : null}
              />
            </section>
          )}

          <section className="repo-issues-section">
            <div className="repo-section-headline">
              <div>
                <small>Issues and bugs</small>
                <h3>Copy-ready repair context</h3>
              </div>
              <div className="repo-copy-actions">
                <button type="button" className="repo-copy-btn" onClick={() => handleCopy('json', agentPackJson)}>
                  {copyFeedback === 'json' ? 'Copied JSON' : 'Copy AI Pack v1'}
                </button>
                <button type="button" className="repo-copy-btn" onClick={() => handleCopy('prompt', fixPrompt)}>
                  {copyFeedback === 'prompt' ? 'Copied prompt' : 'Copy fix prompt'}
                </button>
              </div>
            </div>
            <div className="repo-issue-grid grid gap-4 lg:grid-cols-2 p-4">
              {packIssues.length > 0 ? (
                packIssues.map((issue) => <IssueCard key={issue.id} issue={issue} repoId={repoId} />)
              ) : (
                <article className="repo-empty-state col-span-full">
                  <strong>No major issues detected</strong>
                </article>
              )}
            </div>
          </section>

          <section className="repo-next-grid">
            <Link to={buildModePath('coder', repoId, 'architecture')} className="repo-next-card">
              <strong>Open architecture</strong>
              <span>Systems, domains, graph, smells.</span>
            </Link>
            <Link to={buildModePath('coder', repoId, 'flows')} className="repo-next-card">
              <strong>Open flows</strong>
              <span>Execution paths and journeys.</span>
            </Link>
            <Link to={buildModePath('ai', repoId, 'json')} className="repo-next-card">
              <strong>Open AI JSON</strong>
              <span>Full AI Pack v1 with copy.</span>
            </Link>
          </section>

          <Overview memory={memory} healthScore={healthScore} hideHealthScore />
        </div>
      </div>
    </div>
  )
}
