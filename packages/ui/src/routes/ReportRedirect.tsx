import { useEffect } from 'react'
import { MNEMOS_REPORT_PATH } from '@/lib/support'
import { LoadingState } from '@/shell/PageLayout'
import { useI18n } from '@/i18n'

export const ReportRedirect = () => {
  const { t } = useI18n()

  useEffect(() => {
    window.location.replace(MNEMOS_REPORT_PATH)
  }, [])

  return <LoadingState message={t('report.opening')} />
}
