export interface NotFoundHint {
  title: string
  description: string
  reasons: string[]
  commands: { label: string; cmd: string }[]
  openPath?: { label: string; href: string }
}

export const hintForPath = (pathname: string): NotFoundHint | null => {
  const path = pathname.toLowerCase()

  if (path.includes('report')) {
    return {
      title: "Mnemos can't find this HTML report",
      description:
        'The interactive dashboard is separate from the static HTML report. This URL is not a React route.',
      reasons: [
        'You may not have run a mnestis build yet — the report is generated into `.mentis/report/`.',
        'The correct URL is `/.mentis/report/index.html`, not `/report/index.html`.',
        'If you moved or deleted `.mentis/`, regenerate intelligence first.',
      ],
      commands: [
        { label: 'Analyze repository', cmd: 'npx mnestis .' },
        { label: 'Rebuild memory', cmd: 'npx mnestis build' },
      ],
      openPath: { label: 'Open report at /.mentis/report/index.html', href: '/.mentis/report/index.html' },
    }
  }

  if (path.includes('.mentis') || path.includes('memory.json')) {
    return {
      title: "Mnemos artifacts aren't available at this URL",
      description: 'Static files are served from `/.mentis/` after a successful build.',
      reasons: [
        'Run Mnemos against your repository root first.',
        'In workspace mode, artifacts live under `/.mentis/{repoId}/`.',
      ],
      commands: [
        { label: 'Build intelligence', cmd: 'npx mnestis build' },
        { label: 'Analyze + build', cmd: 'npx mnestis .' },
      ],
    }
  }

  return null
}
