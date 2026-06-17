import { cn } from '@/lib/utils'

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean
}

export const Toggle = ({ pressed, className, ...props }: ToggleProps) => (
  <button
    type="button"
    aria-pressed={pressed}
    className={cn(
      'inline-flex items-center justify-center rounded-[var(--radius-xs)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
      pressed && 'bg-[var(--color-surface-2)] text-[var(--color-fg)]',
      className,
    )}
    {...props}
  />
)

interface ToggleGroupProps {
  value: string
  onValueChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  ariaLabel?: string
}

export const ToggleGroup = ({ value, onValueChange, options, className, ariaLabel }: ToggleGroupProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={cn(
      'inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5',
      className,
    )}
  >
    {options.map((opt) => (
      <Toggle
        key={opt.value}
        pressed={value === opt.value}
        onClick={() => onValueChange(opt.value)}
        className={cn(value === opt.value && 'bg-[var(--color-surface)] shadow-sm')}
      >
        {opt.label}
      </Toggle>
    ))}
  </div>
)
