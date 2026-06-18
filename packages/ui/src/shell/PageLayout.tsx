import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MnemosLogo } from '@/components/illustrations/MnemosLogo'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  wide?: boolean
}

export const PageLayout = ({ children, className, wide }: PageLayoutProps) => (
  <div
    className={cn(
      'mx-auto w-full px-5 py-6 md:px-8 md:py-8',
      wide ? 'max-w-[1600px]' : 'max-w-6xl',
      className,
    )}
  >
    {children}
  </div>
)

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  icon?: ReactNode
}

export const PageHeader = ({ title, description, eyebrow, actions, icon }: PageHeaderProps) => (
  <header className="glass-panel glass-panel--elevated mb-8 flex flex-wrap items-start justify-between gap-4 p-6">
    <div className="relative flex items-start gap-4">
      {icon && (
        <div className="metallic-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-accent)]">
          {icon}
        </div>
      )}
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-fg-muted)] md:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
    {actions && <div className="relative flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
)

interface MetricGridProps {
  children: ReactNode
  cols?: 2 | 3 | 4
}

export const MetricGrid = ({ children, cols = 4 }: MetricGridProps) => (
  <div
    className={cn(
      'grid gap-3',
      cols === 2 && 'sm:grid-cols-2',
      cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
    )}
  >
    {children}
  </div>
)

interface SubNavProps<T extends string> {
  items: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
}

export const SubNav = <T extends string>({ items, value, onChange, ariaLabel }: SubNavProps<T>) => (
  <nav
    className="glass-panel mb-6 flex flex-wrap gap-1 p-1"
    aria-label={ariaLabel}
  >
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        className={cn(
          'rounded-[var(--radius-xs)] px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          value === item.id
            ? 'glass-panel--elevated text-[var(--color-fg)] shadow-sm'
            : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
        )}
        aria-current={value === item.id ? 'page' : undefined}
      >
        {item.label}
      </button>
    ))}
  </nav>
)

export const LoadingState = ({ message = 'Loading repository intelligence…' }: { message?: string }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
    <div className="glass-panel flex flex-col items-center gap-4 px-8 py-6">
      <MnemosLogo size={40} />
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-ping rounded-full bg-[var(--color-accent)]/15" />
        <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--color-accent)]" />
      </div>
      <p className="text-sm text-[var(--color-fg-muted)]">{message}</p>
    </div>
  </div>
)

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) => (
  <div className="glass-panel flex flex-col items-center justify-center px-6 py-16 text-center">
    <p className="font-semibold">{title}</p>
    {description && <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-muted)]">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const ContentWell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('glass-content-well p-4 md:p-6', className)}>{children}</div>
)
