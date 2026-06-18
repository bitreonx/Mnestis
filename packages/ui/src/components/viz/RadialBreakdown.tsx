import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'
import { categoricalColor } from './tone'

export interface BreakdownSegment {
  label: string
  value: number
  color?: string
}

interface RadialBreakdownProps {
  segments: BreakdownSegment[]
  size?: number
  /** Center caption under the total (e.g. "entities"). */
  centerLabel?: string
  className?: string
}

const R = 46
const CIRC = 2 * Math.PI * R

/**
 * Donut breakdown for categorical counts (domains / flows / services / APIs).
 * Each segment animates in; the total sits in the center with a legend below.
 * Token-backed categorical palette; reduced-motion aware.
 */
export const RadialBreakdown = ({
  segments,
  size = 160,
  centerLabel,
  className,
}: RadialBreakdownProps) => {
  const reduced = useReducedMotion()
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  let offsetAcc = 0
  const arcs = segments.map((seg, i) => {
    const fraction = total > 0 ? seg.value / total : 0
    const dash = fraction * CIRC
    const arc = {
      seg,
      color: seg.color ?? categoricalColor(i),
      dash,
      // gap before this segment = accumulated rotation
      rotation: (offsetAcc / CIRC) * 360,
    }
    offsetAcc += dash
    return arc
  })

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`}>
      <div style={{ width: size, height: size }} className="relative" role="img" aria-label={`Breakdown, ${total} total`}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-raised)" strokeWidth={10} />
          {arcs.map(({ seg, color, dash, rotation }) => (
            <motion.circle
              key={seg.label}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth={10}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              transform={`rotate(${rotation} 60 60)`}
              initial={{ opacity: reduced ? 1 : 0, strokeDashoffset: reduced ? 0 : dash }}
              animate={{ opacity: 1, strokeDashoffset: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-[var(--color-fg)]">{total}</span>
          {centerLabel && <span className="text-xs text-[var(--color-fg-muted)]">{centerLabel}</span>}
        </div>
      </div>

      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5" role="list">
        {arcs.map(({ seg, color }) => (
          <li key={seg.label} className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} aria-hidden />
            <span className="text-[var(--color-fg)]">{seg.label}</span>
            <span className="tabular-nums">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
