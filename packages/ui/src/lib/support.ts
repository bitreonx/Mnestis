export const GITHUB_REPO = 'https://github.com/bitreonx/mnemos'
export const GITHUB_ISSUES = 'https://github.com/bitreonx/mnemos/issues'
export const MNEMOS_REPORT_PATH = '/.mentis/report/index.html'

export const reportIssueUrl = (params?: {
  title?: string
  body?: string
  labels?: string[]
}) => {
  const search = new URLSearchParams()
  if (params?.title) search.set('title', params.title)
  if (params?.body) search.set('body', params.body)
  if (params?.labels?.length) search.set('labels', params.labels.join(','))
  const q = search.toString()
  return q ? `${GITHUB_ISSUES}/new?${q}` : `${GITHUB_ISSUES}/new`
}

export const reportUiBugUrl = (detail?: string) =>
  reportIssueUrl({
    title: 'UI bug: Mnemos dashboard',
    labels: ['bug', 'ui'],
    body: [
      '## What happened',
      detail ?? 'Describe what you expected vs what you saw.',
      '',
      '## Steps to reproduce',
      '1.',
      '2.',
      '',
      '## Environment',
      `- URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      `- User agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
      '',
      '## Mnemos output',
      'Paste relevant `.mentis/` errors or CLI output if applicable.',
    ].join('\n'),
  })
