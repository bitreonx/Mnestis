import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-xs)] border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--color-accent)] text-[var(--color-bg)]',
        secondary: 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-fg)]',
        outline: 'border-[var(--color-border)] text-[var(--color-fg)]',
        success: 'border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)]',
        warn: 'border-transparent bg-[var(--color-warn)]/15 text-[var(--color-warn)]',
        danger: 'border-transparent bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
        info: 'border-transparent bg-[var(--color-info)]/15 text-[var(--color-info)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
)
