import { useEffect, useState } from 'react'

/**
 * Live `prefers-reduced-motion` flag. Every viz primitive reads this and skips
 * its enter/count-up animation (rendering the final frame immediately) when the
 * user has asked for reduced motion.
 */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
