import { cn } from '@/lib/utils'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export const Separator = ({ orientation = 'horizontal', className }: SeparatorProps) => (
  <div
    role="separator"
    aria-orientation={orientation}
    className={cn(
      'shrink-0 bg-[var(--color-border)]',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
  />
)
