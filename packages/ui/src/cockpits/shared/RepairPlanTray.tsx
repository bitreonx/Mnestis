import { Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import type { AiPackIssue } from '@/lib/ai-pack-client'

interface RepairPlanTrayProps {
  issues: AiPackIssue[]
  repoId: string
  onClear: () => void
}

export const RepairPlanTray = ({ issues, repoId, onClear }: RepairPlanTrayProps) => {
  if (issues.length === 0) return null

  const planText = [
    `Repair plan for repository "${repoId}" (${issues.length} issues):`,
    '',
    ...issues.map((issue, i) =>
      `${i + 1}. [${issue.severity}] ${issue.title}\n   ${issue.summary}\n   ${issue.recommendation ?? ''}`,
    ),
    '',
    'Fix these in priority order. Use project.dna.json and Mnemos context docs.',
  ].join('\n')

  return (
    <div
      className="fixed bottom-4 left-1/2 z-40 flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-xl"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm">{issues.length} issue{issues.length !== 1 ? 's' : ''} in repair plan</span>
      <Button
        size="sm"
        onClick={async () => {
          const ok = await copyText(planText)
          toast[ok ? 'success' : 'error'](ok ? 'Repair plan copied' : 'Copy failed')
        }}
      >
        <Copy className="h-3.5 w-3.5" />
        Copy plan
      </Button>
      <Button size="sm" variant="ghost" aria-label="Clear repair plan" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
