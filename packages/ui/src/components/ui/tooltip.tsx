import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export const Tooltip = ({ content, children, className }: TooltipProps) => (
  <span className={cn('group relative inline-flex', className)}>
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-xs)] bg-[var(--color-surface-raised)] px-2 py-1 text-xs text-[var(--color-fg)] opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {content}
    </span>
  </span>
)
