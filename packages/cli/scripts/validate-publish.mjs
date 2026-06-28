#!/usr/bin/env node
/**
 * Fail fast before npm publish if bin/files are misconfigured.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cliDir = path.resolve(__dirname, '..')
const pkgPath = path.join(cliDir, 'package.json')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const corePkgPath = path.join(cliDir, '..', 'core', 'package.json')
const coreVersion = JSON.parse(readFileSync(corePkgPath, 'utf-8')).version

if (pkg.version !== coreVersion) {
  console.error(`[validate] version mismatch: mnestis ${pkg.version} vs @mnestis/core ${coreVersion}`)
  console.error('[validate] sync all package.json versions before publishing')
  process.exit(1)
}

if (!pkg.bin || typeof pkg.bin !== 'object' || Array.isArray(pkg.bin)) {
  console.error('[validate] package.json "bin" must be a flat object of string paths')
  process.exit(1)
}

for (const [name, target] of Object.entries(pkg.bin)) {
  if (typeof target !== 'string') {
    console.error(`[validate] bin.${name} must be a string path, got ${typeof target}`)
    console.error('[validate] nested bin objects break npm — use bin/*.cjs wrappers')
    process.exit(1)
  }
  const rel = target.replace(/^\.\//, '')
  const abs = path.join(cliDir, rel)
  if (!existsSync(abs)) {
    console.error(`[validate] missing bin target: ${target}`)
    process.exit(1)
  }
}

for (const file of pkg.files ?? []) {
  const abs = path.join(cliDir, file)
  if (!existsSync(abs)) {
    console.error(`[validate] missing files[] entry: ${file}`)
    process.exit(1)
  }
}

if (!existsSync(path.join(cliDir, 'dist', 'npm.cjs'))) {
  console.error('[validate] dist/npm.cjs missing — run npm run prepare:publish')
  process.exit(1)
}

if (pkg.publishConfig?.provenance && !process.env.CI) {
  console.warn('[validate] publishConfig.provenance is set — local publish will fail.')
  console.warn('[validate] Remove provenance from publishConfig; CI passes --provenance explicitly.')
}

console.log('[validate] publish artifact OK')
console.log(`[validate] bins: ${Object.keys(pkg.bin).join(', ')}`)
