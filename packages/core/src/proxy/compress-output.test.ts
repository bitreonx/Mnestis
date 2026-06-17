import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compressCommandOutput } from '../proxy/compress-output.js';

describe('compressCommandOutput', () => {
  it('strips ANSI and dedupes consecutive lines', () => {
    const raw = '\x1b[32mok\x1b[0m\nok\nline2\nline2\n';
    const { text, stats } = compressCommandOutput(raw, { maxLines: 10 });
    assert.ok(text.includes('ok'));
    assert.ok(text.split('\n').length <= 3);
    assert.ok(stats.savingsPercent >= 0);
  });

  it('truncates long lines', () => {
    const long = 'x'.repeat(500);
    const { text } = compressCommandOutput(long, { maxLineLength: 80 });
    assert.ok(text.endsWith('…'));
  });
});
