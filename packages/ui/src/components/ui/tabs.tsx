import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (v: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  className?: string
  children: ReactNode
}

export const Tabs = ({ value: controlled, defaultValue = '', onValueChange, className, children }: TabsProps) => {
  const [internal, setInternal] = useState(defaultValue)
  const value = controlled ?? internal
  const handleChange = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div
    role="tablist"
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-1 text-[var(--color-fg-muted)]',
      className,
    )}
  >
    {children}
  </div>
)

interface TabsTriggerProps {
  value: string
  className?: string
  children: ReactNode
}

export const TabsTrigger = ({ value, className, children }: TabsTriggerProps) => {
  const ctx = useContext(TabsContext)
  if (!ctx) return null
  const active = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-xs)] px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        active && 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm',
        className,
      )}
      onClick={() => ctx.onValueChange(value)}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, className, children }: { value: string; className?: string; children: ReactNode }) => {
  const ctx = useContext(TabsContext)
  if (!ctx || ctx.value !== value) return null
  return (
    <div role="tabpanel" className={cn('mt-4 focus-visible:outline-none', className)}>
      {children}
    </div>
  )
}
