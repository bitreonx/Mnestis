import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { MODE_SECTIONS } from '@/core/navigation'
import { MNEMOS_REPORT_PATH } from '@/lib/support'
import { buildModePath, getStoredRepoId, type MnemosMode } from '@/lib/mode'
import type { FocusMode } from '@/dashboard'

export const CommandPaletteRouter = () => {
  const navigate = useNavigate()
  const { repoId: routeRepoId } = useParams()
  const [open, setOpen] = useState(false)
  const repoId = routeRepoId ?? getStoredRepoId() ?? 'local'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[12vh]"
      role="dialog"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-panel glass-panel--elevated glass-glow w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent">
          <CommandInput placeholder="Jump to cockpit, section, or artifact…" />
          <CommandList>
            <CommandEmpty>No matching route.</CommandEmpty>
            <CommandGroup heading="Cockpits">
              {(['vibe', 'ai', 'coder'] as FocusMode[]).map((mode) => (
                <CommandItem key={mode} onSelect={() => go(buildModePath(mode, repoId))}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} cockpit
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            {(['vibe', 'ai', 'coder'] as MnemosMode[]).map((mode) => (
              <CommandGroup key={mode} heading={`${mode} sections`}>
                {MODE_SECTIONS[mode].map((s) => (
                  <CommandItem key={s.id} onSelect={() => go(buildModePath(mode, repoId, s.id))}>
                    {s.label}
                    {s.desc && <span className="ms-2 text-[var(--color-muted)]">— {s.desc}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandSeparator />
            <CommandGroup heading="Artifacts">
              <CommandItem onSelect={() => go(`/json/${repoId}`)}>AI Pack JSON</CommandItem>
              <CommandItem onSelect={() => window.open(MNEMOS_REPORT_PATH, '_blank')}>
                HTML report
              </CommandItem>
              <CommandItem onSelect={() => go('/')}>Mode picker / home</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
