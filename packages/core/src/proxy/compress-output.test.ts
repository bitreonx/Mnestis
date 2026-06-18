import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { compressCommandOutput, estimateTokens } from '../proxy/compress-output.js'

describe('estimateTokens', () => {
  it('returns 0 for empty input', () => {
    assert.equal(estimateTokens(''), 0)
  })

  it('estimates more tokens for dense code than short prose', () => {
    const prose = estimateTokens('the quick brown fox')
    const code = estimateTokens('function foo(a,b){return a+b;}')
    assert.ok(code >= prose)
  })
})

describe('compressCommandOutput', () => {
  it('strips ANSI and dedupes consecutive lines', () => {
    const raw = '\x1b[32mok\x1b[0m\nok\nline2\nline2\n'
    const { text, stats } = compressCommandOutput(raw, { maxLines: 10 })
    assert.ok(text.includes('ok'))
    assert.ok(text.split('\n').length <= 3)
    assert.ok(stats.savingsPercent >= 0)
  })

  it('truncates long lines', () => {
    const long = 'x'.repeat(500)
    const { text } = compressCommandOutput(long, { maxLineLength: 80 })
    assert.ok(text.endsWith('…'))
  })

  it('strips spinner and progress noise', () => {
    const raw = '⠋ Building...\nactual output\n100%\nreal result\n'
    const { text, stats } = compressCommandOutput(raw)
    assert.ok(text.includes('actual output'))
    assert.ok(text.includes('real result'))
    assert.ok(!text.includes('Building'))
    assert.ok((stats.phaseStats?.noiseStripped ?? 0) >= 2)
  })

  it('shortens absolute paths', () => {
    const raw = 'Error at C:\\Users\\dev\\projects\\app\\src\\index.ts:12:4'
    const { text, stats } = compressCommandOutput(raw)
    assert.ok(text.includes('src/index.ts'))
    assert.ok(!text.includes('C:\\Users'))
    assert.ok((stats.phaseStats?.pathsShortened ?? 0) >= 1)
  })

  it('folds long stack traces', () => {
    const frames = Array.from({ length: 8 }, (_, i) => `  at handler (/app/src/layer${i}.ts:${i + 1}:1)`)
    const raw = ['Error: boom', ...frames].join('\n')
    const { text, stats } = compressCommandOutput(raw, { maxLines: 120 })
    assert.ok(text.includes('Error: boom'))
    assert.ok(text.includes('more stack frame'))
    assert.ok((stats.phaseStats?.stackFramesFolded ?? 0) >= 1)
    assert.ok(text.split('\n').length < frames.length + 2)
  })

  it('keeps error lines when over budget', () => {
    const lines = [
      ...Array.from({ length: 30 }, (_, i) => `info line ${i}`),
      'FAIL test/auth should validate token',
      ...Array.from({ length: 30 }, (_, i) => `debug trace ${i}`),
    ]
    const { text } = compressCommandOutput(lines.join('\n'), { maxLines: 10 })
    assert.ok(text.includes('FAIL test/auth'))
  })

  it('fuzzy-dedupes near-identical lines', () => {
    const raw = 'test 1 passed in 12ms\ntest 2 passed in 13ms\ntest 3 passed in 14ms\n'
    const { text, stats } = compressCommandOutput(raw, { maxLines: 50 })
    assert.ok(text.split('\n').length <= 2)
    assert.ok((stats.phaseStats?.duplicatesRemoved ?? 0) >= 1)
  })
})
