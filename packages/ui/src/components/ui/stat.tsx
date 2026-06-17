import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warn' | 'danger'
  className?: string
}

const toneClass: Record<NonNullable<StatProps['tone']>, string> = {
  default: 'text-[var(--color-fg)]',
  success: 'text-[var(--color-success)]',
  warn: 'text-[var(--color-warn)]',
  danger: 'text-[var(--color-danger)]',
}

export const Stat = ({ label, value, hint, icon, tone = 'default', className }: StatProps) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
      {icon}
      <span>{label}</span>
    </div>
    <div className={cn('text-2xl font-semibold tabular-nums', toneClass[tone])}>{value}</div>
    {hint && <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>}
  </div>
)
