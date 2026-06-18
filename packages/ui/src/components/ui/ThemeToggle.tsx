import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { useTheme, type ThemeChoice } from '@/styles/theme'

const NEXT_LABEL: Record<ThemeChoice, string> = {
  light: 'shell.theme.dark',
  dark: 'shell.theme.system',
  system: 'shell.theme.light',
}

/**
 * Single-button theme control that cycles light → dark → system.
 * The icon reflects the *current* choice; the aria-label announces what a
 * press will switch to, so it stays meaningful in both languages.
 */
export const ThemeToggle = () => {
  const { theme, cycleTheme } = useTheme()
  const { t } = useI18n()

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`${t('shell.theme.label')}: ${t(`shell.theme.${theme}`)} — ${t(NEXT_LABEL[theme])}`}
      title={t(`shell.theme.${theme}`)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
