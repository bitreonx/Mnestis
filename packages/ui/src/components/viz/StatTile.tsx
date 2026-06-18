import { useEffect, useState, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'
import { Sparkline } from './Sparkline'

interface StatTileProps {
  label: string
  value: number
  /** Optional unit/suffix shown after the value (e.g. "%"). */
  unit?: string
  icon?: ReactNode
  /** Optional inline trend. */
  trend?: number[]
  /** Signed delta vs. a previous reading; colored by sign. */
  delta?: number
  color?: string
  className?: string
}

/**
 * Compact metric tile for domain / flow / service / API counts and the like.
 * Count-up value, optional icon, sparkline, and signed delta. Token-styled and
 * reduced-motion aware. Uses logical padding so it mirrors under RTL.
 */
export const StatTile = ({
  label,
  value,
  unit,
  icon,
  trend,
  delta,
  color = 'var(--color-accent)',
  className,
}: StatTileProps) => {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, reduced])

  return (
    <div
      className={`glass-panel rounded-[var(--radius-md)] p-4 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{label}</span>
        {icon && <span className="text-[var(--color-fg-muted)]">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums leading-none text-[var(--color-fg)]">
          {display}
          {unit && <span className="text-base font-normal text-[var(--color-fg-muted)]">{unit}</span>}
        </span>
        {trend && trend.length >= 2 && <Sparkline data={trend} color={color} area ariaLabel={`${label} trend`} />}
      </div>
      {delta != null && delta !== 0 && (
        <p
          className="mt-1 text-xs tabular-nums"
          style={{ color: delta > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
        >
          {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
        </p>
      )}
    </div>
  )
}
