import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => (
  <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
    {items.map((item, i) => (
      <span key={item.label} className="flex items-center gap-1">
        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden />}
        {item.href || item.onClick ? (
          <a
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault()
                item.onClick()
              }
            }}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm"
          >
            {item.label}
          </a>
        ) : (
          <span className="font-medium text-[var(--color-fg)]">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
)
