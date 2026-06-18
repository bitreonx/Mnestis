import { useId } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  /** Fill the area under the line with a fading gradient. */
  area?: boolean
  className?: string
  ariaLabel?: string
}

/**
 * Compact inline trend line built from raw numbers. SVG coordinates aren't
 * affected by text direction, so it renders identically in LTR and RTL. The
 * line draws on enter (path-length animation) unless reduced motion is set.
 */
export const Sparkline = ({
  data,
  width = 96,
  height = 28,
  color = 'var(--color-accent)',
  area = false,
  className,
  ariaLabel,
}: SparklineProps) => {
  const reduced = useReducedMotion()
  const gradientId = useId()

  if (data.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 2
  const stepX = (width - pad * 2) / (data.length - 1)
  const points = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (height - pad * 2) * (1 - (v - min) / span)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const areaPath = `${line} L ${points[points.length - 1][0].toFixed(2)} ${height - pad} L ${points[0][0].toFixed(2)} ${height - pad} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={ariaLabel ?? 'Trend'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {area && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </svg>
  )
}
