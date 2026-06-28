#!/usr/bin/env node
/** Fail CI if workspace package versions drift (common npm publish failure). */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packages = [
  'package.json',
  'packages/core/package.json',
  'packages/cli/package.json',
  'packages/sdk/package.json',
  'packages/getmnemos-legacy/package.json',
]

const versions = packages.map((rel) => {
  const full = path.join(root, rel)
  const v = JSON.parse(readFileSync(full, 'utf-8')).version
  return { rel, v }
})

const canonical = versions.find((p) => p.rel === 'packages/cli/package.json')?.v
let ok = true
for (const { rel, v } of versions) {
  if (v !== canonical) {
    console.error(`[sync-versions] ${rel} is ${v}, expected ${canonical}`)
    ok = false
  }
}

if (!ok) process.exit(1)
console.log(`[sync-versions] all packages at ${canonical}`)
