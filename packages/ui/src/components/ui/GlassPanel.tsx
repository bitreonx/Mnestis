import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type GlassVariant = 'default' | 'elevated' | 'subtle' | 'inset'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant
  glow?: boolean
}

const variantClass: Record<GlassVariant, string> = {
  default: 'glass-panel',
  elevated: 'glass-panel glass-panel--elevated',
  subtle: 'glass-panel glass-panel--subtle',
  inset: 'glass-panel glass-panel--inset',
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = 'default', glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(variantClass[variant], glow && 'glass-glow', className)}
      {...props}
    >
      {children}
    </div>
  ),
)
GlassPanel.displayName = 'GlassPanel'
