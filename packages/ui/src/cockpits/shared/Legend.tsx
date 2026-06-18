import { LayoutDashboard, FileText, Braces } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MNEMOS_REPORT_PATH } from '@/lib/support'

export type ArtifactKind = 'dashboard' | 'report' | 'json'

interface LegendProps {
  active: ArtifactKind
  repoId?: string
  className?: string
}

const ITEMS: { id: ArtifactKind; label: string; icon: typeof LayoutDashboard; href: (repoId: string) => string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: () => '#' },
  { id: 'report', label: 'Report', icon: FileText, href: () => MNEMOS_REPORT_PATH },
  { id: 'json', label: 'AI JSON', icon: Braces, href: (id) => `/json/${id}` },
]

export const Legend = ({ active, repoId = 'local', className }: LegendProps) => {
  const location = useLocation()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1',
        className,
      )}
      role="group"
      aria-label="What am I looking at?"
    >
      <span className="hidden px-2 text-xs text-[var(--color-muted)] sm:inline">What am I looking at?</span>
      {ITEMS.map(({ id, label, icon: Icon, href }) => {
        const isActive = active === id
        const to = id === 'dashboard' ? location.pathname : href(repoId)
        const isExternal = id === 'report'

        const cls = cn(
          'inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          isActive
            ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm'
            : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
        )

        if (isExternal) {
          return (
            <a key={id} href={to} target="_blank" rel="noopener noreferrer" className={cls} aria-current={isActive ? 'page' : undefined}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </a>
          )
        }

        return (
          <Link key={id} to={to} className={cls} aria-current={isActive ? 'page' : undefined}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
