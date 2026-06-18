import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { WorkspaceCopilot } from '@/components/WorkspaceCopilot'
import { CodeBlock } from '@/components/ui/code-block'
import { useIntelligence } from '@/core/IntelligenceProvider'
import { AI_SUBSECTIONS } from '@/core/navigation'
import { PageLayout, PageHeader, SubNav, LoadingState, ContentWell } from '@/shell/PageLayout'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/utils'

const CONTEXT_DOCS = [
  'architecture.md',
  'domains.md',
  'flows.md',
  'apis.md',
  'services.md',
  'critical_paths.md',
  'smells.md',
]

export const CopilotSection = () => {
  const {
    loading,
    memory,
    repo,
    suggestedPrompts,
    aiView,
    setAiView,
    contextDoc,
    setContextDoc,
    contextContent,
    copilotSeed,
    setCopilotSeed,
    agentPackJson,
    fixPrompt,
  } = useIntelligence()
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  if (loading || !memory) return <LoadingState />

  const handleCopy = async (label: string, text: string) => {
    await copyText(text)
    setCopyFeedback(label)
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  return (
    <PageLayout wide>
      <PageHeader
        title="Copilot"
        description="Ask architecture questions backed by Mnemos intelligence — or browse agent context docs."
        icon={<MessageSquare className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleCopy('json', agentPackJson)}>
              {copyFeedback === 'json' ? 'Copied' : 'Copy AI Pack'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCopy('prompt', fixPrompt)}>
              {copyFeedback === 'prompt' ? 'Copied' : 'Copy fix prompt'}
            </Button>
          </>
        }
      />

      <SubNav items={AI_SUBSECTIONS} value={aiView} onChange={setAiView} ariaLabel="AI views" />

      <ContentWell className="min-h-[520px] overflow-hidden p-0">
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
          <div className="flex h-[560px]">
            <nav
              className="w-44 shrink-0 overflow-y-auto border-e border-[var(--color-border)] p-2"
              aria-label="Context documents"
            >
              {CONTEXT_DOCS.map((doc) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() => setContextDoc(doc)}
                  className={cn(
                    'block w-full rounded-[var(--radius-xs)] px-2 py-1.5 text-left text-xs transition-colors',
                    contextDoc === doc
                      ? 'bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]'
                      : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
                  )}
                >
                  {doc.replace('.md', '')}
                </button>
              ))}
            </nav>
            <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-[var(--color-fg-muted)]">
              {contextContent}
            </pre>
          </div>
        )}
      </ContentWell>

      {aiView === 'copilot' && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">AI Pack preview</p>
          <CodeBlock code={agentPackJson.slice(0, 2000) + (agentPackJson.length > 2000 ? '…' : '')} language="json" />
        </div>
      )}
    </PageLayout>
  )
}
