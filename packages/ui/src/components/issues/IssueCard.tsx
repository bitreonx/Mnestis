import { AlertTriangle, AlertCircle, Info, Copy, MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import type { AiPackIssue } from '@/lib/ai-pack-client'

interface IssueCardProps {
  issue: AiPackIssue
  repoId: string
  onAddToPlan?: (issue: AiPackIssue) => void
}

const severityConfig = {
  high: { icon: AlertTriangle, label: 'High', variant: 'danger' as const },
  medium: { icon: AlertCircle, label: 'Medium', variant: 'warn' as const },
  low: { icon: Info, label: 'Low', variant: 'info' as const },
}

export const IssueCard = ({ issue, repoId, onAddToPlan }: IssueCardProps) => {
  const [copied, setCopied] = useState<'json' | 'prompt' | null>(null)
  const cfg = severityConfig[issue.severity] ?? severityConfig.medium
  const Icon = cfg.icon

  const issueJson = JSON.stringify({ repository: repoId, issue }, null, 2)
  const prompt = [
    `Fix this issue in repository "${repoId}":`,
    `Title: ${issue.title}`,
    `Severity: ${issue.severity}`,
    `Summary: ${issue.summary}`,
    issue.recommendation ? `Recommendation: ${issue.recommendation}` : '',
    issue.files?.length ? `Files: ${issue.files.join(', ')}` : '',
    '',
    'Use Mnemos AI Pack and project.dna.json as ground truth. Return a concrete repair plan.',
  ].filter(Boolean).join('\n')

  const handleCopy = async (kind: 'json' | 'prompt', text: string) => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
      toast.success(kind === 'json' ? 'Issue JSON copied' : 'Prompt copied')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold leading-tight">{issue.title}</h3>
            <Badge variant={cfg.variant} className="mt-1">{cfg.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{issue.summary}</p>
        {issue.files && issue.files.length > 0 && (
          <ul className="list-inside list-disc text-[var(--color-fg-muted)]">
            {issue.files.slice(0, 5).map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}
        {issue.recommendation && (
          <p className="text-[var(--color-fg-muted)]"><strong>Why this matters:</strong> {issue.recommendation}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleCopy('json', issueJson)}>
          <Copy className="h-3.5 w-3.5" />
          {copied === 'json' ? 'Copied' : 'Copy as JSON'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleCopy('prompt', prompt)}>
          <Copy className="h-3.5 w-3.5" />
          {copied === 'prompt' ? 'Copied' : 'Copy as prompt'}
        </Button>
        {onAddToPlan && (
          <Button size="sm" variant="ghost" onClick={() => onAddToPlan(issue)}>
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Add to repair plan
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
