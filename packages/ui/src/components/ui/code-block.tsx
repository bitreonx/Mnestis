import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { copyText } from '@/lib/clipboard'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  copyLabel?: string
}

export const CodeBlock = ({ code, language = 'json', className, copyLabel = 'Copy' }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)]', className)}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{language}</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copyLabel}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : copyLabel}
        </Button>
      </div>
      <pre className="max-h-[32rem] overflow-auto p-4 font-mono text-xs leading-relaxed text-[var(--color-fg)]">
        <code>{code}</code>
      </pre>
    </div>
  )
}
