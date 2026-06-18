import { useId } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

export interface TrendPoint {
  label?: string
  value: number
}

interface TrendChartProps {
  data: TrendPoint[]
  height?: number
  color?: string
  /** Clamp the value axis; defaults to data min/max with padding. */
  min?: number
  max?: number
  className?: string
  ariaLabel?: string
}

/**
 * Responsive area + line chart for score-over-time / build history. Fills its
 * container width via a viewBox, fades an area under the line, and marks the
 * latest point. Token-backed colors; SVG content is direction-neutral so it
 * reads the same in LTR and RTL. Honors reduced motion.
 */
export const TrendChart = ({
  data,
  height = 160,
  color = 'var(--color-accent)',
  min,
  max,
  className,
  ariaLabel,
}: TrendChartProps) => {
  const reduced = useReducedMotion()
  const gradientId = useId()

  if (data.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
        role="img"
        aria-label={ariaLabel ?? 'Trend chart (insufficient data)'}
      />
    )
  }

  const W = 600
  const H = height
  const pad = 8
  const values = data.map((d) => d.value)
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const span = hi - lo || 1
  const stepX = (W - pad * 2) / (data.length - 1)

  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = pad + (H - pad * 2) * (1 - (d.value - lo) / span)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const areaPath = `${line} L ${points[points.length - 1][0].toFixed(1)} ${H - pad} L ${points[0][0].toFixed(1)} ${H - pad} Z`
  const last = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={H}
      className={className}
      role="img"
      aria-label={ariaLabel ?? 'Trend over time'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        stroke="none"
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r={3.5}
        fill={color}
        initial={{ scale: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.3, delay: 0.9 }}
      />
    </svg>
  )
}
