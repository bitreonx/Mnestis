import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'left' | 'right'
  title?: string
  children: ReactNode
  className?: string
}

export const Sheet = ({ open, onOpenChange, side = 'right', title, children, className }: SheetProps) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close panel"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'relative flex h-full w-full max-w-md flex-col border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl',
          side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" aria-label="Close" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  )
}
