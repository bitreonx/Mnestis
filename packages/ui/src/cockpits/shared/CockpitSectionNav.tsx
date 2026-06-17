import { Link, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buildModePath, type MnemosMode } from '@/lib/mode'

const SECTIONS: Record<MnemosMode, { id: string; label: string; desc?: string }[]> = {
  vibe: [
    { id: 'story', label: 'Story', desc: 'What this repo does' },
    { id: 'journeys', label: 'Journeys', desc: 'User flows' },
    { id: 'capabilities', label: 'Capabilities', desc: 'What it can do' },
    { id: 'health', label: 'Health', desc: 'Scores & breakdown' },
    { id: 'share', label: 'Share', desc: 'Export & report' },
  ],
  ai: [
    { id: 'home', label: 'AI Context' },
    { id: 'json', label: 'JSON Pack' },
    { id: 'repairs', label: 'Repairs' },
    { id: 'verify', label: 'Verify' },
  ],
  coder: [],
}

interface CockpitSectionNavProps {
  mode: MnemosMode
}

export const CockpitSectionNav = ({ mode }: CockpitSectionNavProps) => {
  const { repoId = 'local', section } = useParams()
  const items = SECTIONS[mode]
  if (items.length === 0) return null

  return (
    <nav
      className="sticky top-0 z-10 flex flex-wrap gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2"
      aria-label={`${mode} sections`}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          to={buildModePath(mode, repoId, item.id)}
          className={cn(
            'flex min-w-[7rem] flex-col rounded-[var(--radius-xs)] px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
            section === item.id || (!section && item.id === items[0].id)
              ? 'bg-[var(--color-surface-2)] text-[var(--color-fg)] ring-1 ring-[var(--color-border)]'
              : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
          )}
          aria-current={section === item.id ? 'page' : undefined}
        >
          <span className="text-sm font-medium">{item.label}</span>
          {item.desc && <span className="text-[10px] text-[var(--color-muted)]">{item.desc}</span>}
        </Link>
      ))}
    </nav>
  )
}
