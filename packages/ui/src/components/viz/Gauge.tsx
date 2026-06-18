import { useEffect, useId, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'
import { toneColorForScore } from './tone'

interface GaugeProps {
  /** Current value (0…max). */
  value: number
  max?: number
  /** Pixel size of the square gauge. */
  size?: number
  /** Accessible label, e.g. "Repository health". */
  label?: string
  /** Show the "/ max" scale under the number. */
  showScale?: boolean
  /** Optional small caption under the value. */
  caption?: string
  /** Optional previous value — renders a comparison tick on the arc. */
  comparison?: number
  /** Override the tone color (defaults to score-derived tone). */
  color?: string
}

/** 270° sweep, opening at the bottom. */
const ARC_DEGREES = 270
const START_ANGLE = 135 // bottom-left, sweeping clockwise to bottom-right
const R = 46
const C = 60

const polar = (angleDeg: number, r = R) => {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}

const arcPath = (fraction: number) => {
  const end = START_ANGLE + ARC_DEGREES * Math.min(1, Math.max(0, fraction))
  const start = polar(START_ANGLE)
  const finish = polar(end)
  const largeArc = ARC_DEGREES * fraction > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${finish.x} ${finish.y}`
}

/**
 * Premium radial gauge — the data-viz centerpiece that replaces HealthRing.
 * Animated arc with a gradient stroke and soft glow, a count-up center value,
 * tone-based color, and an optional comparison tick for the previous reading.
 * Reads colors from tokens (re-themes automatically) and honors reduced motion.
 */
export const Gauge = ({
  value,
  max = 100,
  size = 132,
  label = 'Score',
  showScale = true,
  caption,
  comparison,
  color,
}: GaugeProps) => {
  const reduced = useReducedMotion()
  const gradientId = useId()
  const safe = Math.max(0, Math.min(max, value))
  const pct = max > 0 ? safe / max : 0
  const stroke = color ?? toneColorForScore((safe / max) * 100)

  const [display, setDisplay] = useState(reduced ? Math.round(safe) : 0)
  useEffect(() => {
    if (reduced) {
      setDisplay(Math.round(safe))
      return
    }
    const controls = animate(0, safe, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [safe, reduced])

  const fullArc = arcPath(1)
  const valueArc = arcPath(1) // animate via strokeDashoffset using normalized pathLength
  const comparisonAngle =
    comparison != null ? START_ANGLE + ARC_DEGREES * Math.min(1, Math.max(0, comparison / max)) : null
  const tick = comparisonAngle != null ? polar(comparisonAngle, R) : null
  const tickInner = comparisonAngle != null ? polar(comparisonAngle, R - 7) : null

  return (
    <div
      style={{ width: size, height: size }}
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`${label} ${Math.round(safe)} ${showScale ? `out of ${max}` : ''}`.trim()}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-0">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`color-mix(in oklab, ${stroke} 55%, white)`} />
            <stop offset="100%" stopColor={stroke} />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={fullArc}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Animated value arc (normalized pathLength so dashoffset = remaining %) */}
        <motion.path
          d={valueArc}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={9}
          strokeLinecap="round"
          pathLength={1}
          style={{ filter: `drop-shadow(0 0 6px ${stroke})` }}
          initial={{ pathLength: reduced ? pct : 0, opacity: reduced ? 1 : 0 }}
          animate={{ pathLength: pct, opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        />

        {/* Comparison tick */}
        {tick && tickInner && (
          <line
            x1={tickInner.x}
            y1={tickInner.y}
            x2={tick.x}
            y2={tick.y}
            stroke="var(--color-fg)"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums leading-none text-[var(--color-fg)]">
          {display}
          {showScale && <span className="text-sm font-normal text-[var(--color-fg-muted)]">/{max}</span>}
        </span>
        {caption && <span className="mt-1 text-xs text-[var(--color-fg-muted)]">{caption}</span>}
      </div>
    </div>
  )
}
