import type { ReactNode } from 'react'
import { ThemeProvider } from '@/styles/theme'
import { I18nProvider } from '@/i18n'

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <I18nProvider>{children}</I18nProvider>
  </ThemeProvider>
)
