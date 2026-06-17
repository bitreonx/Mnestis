import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

export const CommandPaletteRouter = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]">
      <div className="w-full max-w-lg overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <Command>
          <CommandInput placeholder="Search routes, repos, actions…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Modes">
              <CommandItem onSelect={() => { navigate('/vibe/local/story'); setOpen(false) }}>Vibe cockpit</CommandItem>
              <CommandItem onSelect={() => { navigate('/ai/local/home'); setOpen(false) }}>AI cockpit</CommandItem>
              <CommandItem onSelect={() => { navigate('/coder/local/overview'); setOpen(false) }}>Coder cockpit</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Artifacts">
              <CommandItem onSelect={() => { navigate('/json/local'); setOpen(false) }}>AI Pack JSON</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
