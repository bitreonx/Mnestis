import { useState } from 'react'
import { WorkspaceCopilot } from '@/components/WorkspaceCopilot'
import { CodeBlock } from '@/components/ui/code-block'
import { useRepoWorkspace } from '@/cockpits/coder/RepoWorkspaceContext'
import { CoderWorkspaceLoading } from '@/cockpits/coder/CoderWorkspaceHeader'
import { copyText } from '@/lib/clipboard'

const CONTEXT_DOCS = [
  'architecture.md', 'domains.md', 'flows.md', 'apis.md', 'services.md', 'critical_paths.md', 'smells.md',
]

export const CopilotSection = () => {
  const {
    loading, memory, repo, suggestedPrompts, aiView, setAiView, contextDoc, setContextDoc,
    contextContent, copilotSeed, setCopilotSeed, agentPackJson, fixPrompt,
  } = useRepoWorkspace()
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  if (loading || !memory) return <CoderWorkspaceLoading />

  const handleCopy = async (label: string, text: string) => {
    await copyText(text)
    setCopyFeedback(label)
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  return (
    <div className="repo-workspace-body">
      <div className="repo-sub-layout repo-sub-layout--ai">
        <aside className="repo-sub-nav">
          <button type="button" className={aiView === 'copilot' ? 'active' : ''} onClick={() => setAiView('copilot')}>Copilot</button>
          <button type="button" className={aiView === 'docs' ? 'active' : ''} onClick={() => setAiView('docs')}>Context Docs</button>
          <button type="button" className={aiView === 'json' ? 'active' : ''} onClick={() => setAiView('json')}>JSON Pack</button>
        </aside>
        <div className="repo-sub-content">
          {aiView === 'copilot' && (
            <WorkspaceCopilot
              repoId={repo.id}
              repoName={repo.name}
              suggestedPrompts={suggestedPrompts}
              seedQuestion={copilotSeed}
              onSeedHandled={() => setCopilotSeed(null)}
            />
          )}
          {aiView === 'docs' && (
            <div className="context-docs-view">
              <aside className="context-docs-nav">
                {CONTEXT_DOCS.map((doc) => (
                  <button key={doc} type="button" className={contextDoc === doc ? 'active' : ''} onClick={() => setContextDoc(doc)}>
                    {doc.replace('.md', '')}
                  </button>
                ))}
              </aside>
              <pre className="context-docs-content">{contextContent}</pre>
            </div>
          )}
          {aiView === 'json' && (
            <div className="ai-json-view p-4 space-y-4">
              <div className="repo-section-headline">
                <div>
                  <small>AI Pack v1</small>
                  <h3>Structured agent context</h3>
                </div>
                <div className="repo-copy-actions">
                  <button type="button" className="repo-copy-btn" onClick={() => handleCopy('json', agentPackJson)}>
                    {copyFeedback === 'json' ? 'Copied' : 'Copy AI Pack v1'}
                  </button>
                  <button type="button" className="repo-copy-btn" onClick={() => handleCopy('prompt', fixPrompt)}>
                    {copyFeedback === 'prompt' ? 'Copied prompt' : 'Copy fix prompt'}
                  </button>
                </div>
              </div>
              <CodeBlock code={agentPackJson} language="json" copyLabel="Copy AI Pack v1" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
