import { Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { reportUiBugUrl } from '@/lib/support'
import { cn } from '@/lib/utils'

interface ReportIssueButtonProps {
  detail?: string
  size?: 'sm' | 'default'
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  className?: string
  label?: string
}

export const ReportIssueButton = ({
  detail,
  size = 'sm',
  variant = 'outline',
  className,
  label = 'Report issue on GitHub',
}: ReportIssueButtonProps) => (
  <Button
    variant={variant}
    size={size}
    className={cn(className)}
    onClick={() => window.open(reportUiBugUrl(detail), '_blank', 'noopener,noreferrer')}
  >
    <Bug className="h-4 w-4" aria-hidden />
    {label}
  </Button>
)
