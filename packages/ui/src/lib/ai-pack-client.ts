export interface AiPackIssue {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  summary: string
  files?: string[]
  recommendation?: string
}

export const fetchAiPack = async (
  repoId: string,
  opts: { section?: string; mode?: string } = {},
): Promise<string> => {
  const params = new URLSearchParams()
  if (opts.section) params.set('section', opts.section)
  if (opts.mode) params.set('mode', opts.mode)
  const qs = params.toString()
  const res = await fetch(`/api/json/${repoId}${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('AI Pack unavailable')
  return res.text()
}

export const fetchAiPackParsed = async (
  repoId: string,
  opts: { section?: string; mode?: string } = {},
): Promise<{ issues?: AiPackIssue[]; version?: string }> => {
  const text = await fetchAiPack(repoId, opts)
  return JSON.parse(text) as { issues?: AiPackIssue[]; version?: string }
}
