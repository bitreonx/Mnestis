import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Command = CommandPrimitive

export const CommandInput = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) => (
  <div className="flex items-center border-b border-[var(--color-border)] px-3">
    <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--color-muted)]" />
    <CommandPrimitive.Input
      className={cn(
        'flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-muted)]',
        className,
      )}
      {...props}
    />
  </div>
)

export const CommandList = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) => (
  <CommandPrimitive.List className={cn('max-h-80 overflow-y-auto p-2', className)} {...props} />
)

export const CommandEmpty = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) => (
  <CommandPrimitive.Empty className={cn('py-6 text-center text-sm text-[var(--color-muted)]', className)} {...props} />
)

export const CommandGroup = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) => (
  <CommandPrimitive.Group
    className={cn('[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-muted)]', className)}
    {...props}
  />
)

export const CommandItem = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) => (
  <CommandPrimitive.Item
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-[var(--radius-xs)] px-2 py-2 text-sm outline-none aria-selected:bg-[var(--color-surface-2)]',
      className,
    )}
    {...props}
  />
)

export const CommandSeparator = ({ className }: { className?: string }) => (
  <div className={cn('my-1 h-px bg-[var(--glass-border)]', className)} role="separator" />
)
