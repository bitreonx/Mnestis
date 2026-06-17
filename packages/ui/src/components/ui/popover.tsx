import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

export const Popover = ({ trigger, children, className, align = 'center' }: PopoverProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[12rem] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'end' && 'right-0',
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
