import { Terminal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { copyText } from '@/lib/clipboard'
import { toast } from 'sonner'

const BENCH_COMMANDS = [
  { title: 'Regression suite', cmd: 'npm run bench:regression', desc: 'Verify Mnemos outputs have not regressed against fixtures.' },
  { title: 'Express benchmark', cmd: 'npm run bench:express', desc: 'Score Mnemos on the Express fixture repository.' },
  { title: 'AI blind eval', cmd: 'npm run bench:ai-eval', desc: 'Measure how well an AI answers architecture questions from Mnemos context.' },
  { title: 'Pack smoke test', cmd: 'npx mnemos pack --section=summary', desc: 'Print AI Pack v1 summary to stdout.' },
]

export const VerifySection = () => (
  <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
    <div className="flex items-center gap-3">
      <Terminal className="h-6 w-6 text-[var(--color-accent)]" aria-hidden />
      <h1 className="text-xl font-bold">Verify Mnemos intelligence</h1>
    </div>
    <div className="grid gap-4">
      {BENCH_COMMANDS.map(({ title, cmd, desc }) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs">{cmd}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const ok = await copyText(cmd)
                toast[ok ? 'success' : 'error'](ok ? 'Command copied' : 'Copy failed')
              }}
            >
              Copy command
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
    <CodeBlock
      code={`curl -s http://localhost:4000/copilot/pack/local?section=summary | jq .version`}
      language="bash"
      copyLabel="Copy curl"
    />
  </div>
)
