import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

/**
 * EN / ع language toggle. Flips between English and Arabic, which also flips
 * the document direction (handled inside the i18n provider).
 */
export const LangSwitcher = () => {
  const { lang, toggleLang, t } = useI18n()
  const next = lang === 'en' ? 'ar' : 'en'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLang}
      aria-label={`${t('shell.language.label')}: ${t(`shell.language.${next}`)}`}
      title={t(`shell.language.${next}`)}
    >
      <span className="text-sm font-semibold">{lang === 'en' ? 'ع' : 'EN'}</span>
    </Button>
  )
}
