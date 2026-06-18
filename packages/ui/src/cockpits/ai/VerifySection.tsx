import { Terminal, Copy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'
import { PageLayout, PageHeader } from '@/shell/PageLayout'
import { useParams } from 'react-router-dom'

const BENCH_COMMANDS = [
  { title: 'Regression suite', cmd: 'npm run bench:regression', desc: 'Verify Mnemos outputs have not regressed against fixtures.' },
  { title: 'Express benchmark', cmd: 'npm run bench:express', desc: 'Score Mnemos on the Express fixture repository.' },
  { title: 'AI blind eval', cmd: 'npm run bench:ai-eval', desc: 'Measure how well an AI answers architecture questions from Mnemos context.' },
  { title: 'Pack smoke test', cmd: 'npx mnemos pack --section=summary', desc: 'Print AI Pack v1 summary to stdout.' },
]

export const VerifySection = () => {
  const { repoId = 'local' } = useParams()

  return (
    <PageLayout>
      <PageHeader
        title="Verify intelligence"
        description="Benchmark commands and API smoke tests to validate Mnemos output quality."
        icon={<Terminal className="h-6 w-6" />}
      />

      <div className="grid gap-4">
        {BENCH_COMMANDS.map(({ title, cmd, desc }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <code className="glass-panel rounded-[var(--radius-xs)] px-2 py-1 font-mono text-xs">{cmd}</code>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const ok = await copyText(cmd)
                  toast[ok ? 'success' : 'error'](ok ? 'Command copied' : 'Copy failed')
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="glass-content-well mt-6">
        <p className="mb-3 text-sm font-medium">API smoke test</p>
        <CodeBlock
          code={`curl -s http://localhost:4000/copilot/pack/${repoId}?section=summary | jq .version`}
          language="bash"
          copyLabel="Copy curl"
        />
      </div>
    </PageLayout>
  )
}
