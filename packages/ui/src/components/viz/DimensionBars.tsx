import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'
import { toneColorForScore } from './tone'

export interface DimensionDatum {
  name: string
  value: number
  /** Optional override color (defaults to score-derived tone). */
  color?: string
}

interface DimensionBarsProps {
  items: DimensionDatum[]
  max?: number
  /** Show the numeric value at the row end. */
  showValue?: boolean
  className?: string
  /** Stagger delay between bars (seconds). */
  stagger?: number
}

/**
 * Animated horizontal bars for the health dimensions. Bars grow from the inline
 * start, so the layout mirrors correctly under RTL with no extra work. Colors
 * are token-backed and tone-derived; honors reduced motion.
 */
export const DimensionBars = ({
  items,
  max = 100,
  showValue = true,
  className,
  stagger = 0.06,
}: DimensionBarsProps) => {
  const reduced = useReducedMotion()

  return (
    <ul className={className} role="list">
      {items.map((item, i) => {
        const pct = Math.max(0, Math.min(1, item.value / max))
        const color = item.color ?? toneColorForScore((item.value / max) * 100)
        return (
          <li key={item.name} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-[var(--color-fg)]">{item.name}</span>
              {showValue && (
                <span className="tabular-nums text-[var(--color-fg-muted)]">{Math.round(item.value)}</span>
              )}
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-raised)]"
              role="meter"
              aria-valuenow={Math.round(item.value)}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-label={item.name}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: reduced ? `${pct * 100}%` : 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={reduced ? { duration: 0 } : { duration: 0.7, delay: i * stagger, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
