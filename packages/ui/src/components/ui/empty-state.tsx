import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center',
      className,
    )}
  >
    {icon && <div className="mb-4 text-[var(--color-muted)]">{icon}</div>}
    <h3 className="text-base font-semibold text-[var(--color-fg)]">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
