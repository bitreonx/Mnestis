import { cn } from '@/lib/utils'

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn('animate-pulse rounded-[var(--radius-xs)] bg-[var(--color-surface-2)]', className)}
    aria-hidden="true"
  />
)
