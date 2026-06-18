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
        'You may not have run a Mnemos build yet — the report is generated into `.mnemos/report/`.',
        'The correct URL is `/.mnemos/report/index.html`, not `/report/index.html`.',
        'If you moved or deleted `.mnemos/`, regenerate intelligence first.',
      ],
      commands: [
        { label: 'Analyze repository', cmd: 'npx mnemos .' },
        { label: 'Rebuild memory', cmd: 'npx mnemos build' },
      ],
      openPath: { label: 'Open report at /.mnemos/report/index.html', href: '/.mnemos/report/index.html' },
    }
  }

  if (path.includes('.mnemos') || path.includes('memory.json')) {
    return {
      title: "Mnemos artifacts aren't available at this URL",
      description: 'Static files are served from `/.mnemos/` after a successful build.',
      reasons: [
        'Run Mnemos against your repository root first.',
        'In workspace mode, artifacts live under `/.mnemos/{repoId}/`.',
      ],
      commands: [
        { label: 'Build intelligence', cmd: 'npx mnemos build' },
        { label: 'Analyze + build', cmd: 'npx mnemos .' },
      ],
    }
  }

  return null
}
