import { useEffect, useState } from 'react'

const SPOTLIGHT_KEY = 'mnemos.legend-spotlight'

export const LegendSpotlight = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(SPOTLIGHT_KEY) === '1') return
      setVisible(true)
      const t = window.setTimeout(() => {
        setVisible(false)
        localStorage.setItem(SPOTLIGHT_KEY, '1')
      }, 4000)
      return () => window.clearTimeout(t)
    } catch {
      return undefined
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-14 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm shadow-lg">
        <strong>What am I looking at?</strong>
        <span className="text-[var(--color-fg-muted)]"> — Dashboard is live and interactive. Report is static HTML. AI JSON is the agent contract.</span>
      </div>
    </div>
  )
}
