import { cn } from '@/lib/utils'

interface KbdHintProps {
  keys: string[]
  className?: string
}

export const KbdHint = ({ keys, className }: KbdHintProps) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Shortcut: ${keys.join(' ')}`}>
    {keys.map((key) => (
      <kbd
        key={key}
        className="inline-flex min-w-[1.25rem] items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 py-0.5 font-mono text-[10px] font-medium text-[var(--color-fg-muted)]"
      >
        {key}
      </kbd>
    ))}
  </span>
)
