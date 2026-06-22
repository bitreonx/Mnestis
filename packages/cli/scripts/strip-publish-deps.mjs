#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.join(__dirname, '..', 'package.json')
const backupPath = path.join(__dirname, '..', 'package.json.publish-backup')

export function backupPackageJson() {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  if (pkg.name !== 'mnestis') {
    throw new Error(`[publish] refusing backup — expected name mnestis, got ${pkg.name}`)
  }
  copyFileSync(pkgPath, backupPath)
}

export function stripWorkspaceDeps() {
  if (!existsSync(backupPath)) backupPackageJson()
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  const binSnapshot = JSON.stringify(pkg.bin ?? {})
  pkg.dependencies = {}
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  const after = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  if (JSON.stringify(after.bin ?? {}) !== binSnapshot) {
    throw new Error('[publish] stripWorkspaceDeps corrupted bin — aborting')
  }
  console.log('[publish] cleared workspace dependencies for npm tarball')
}

export function restorePackageJson() {
  if (!existsSync(backupPath)) return
  copyFileSync(backupPath, pkgPath)
  console.log('[publish] restored package.json from backup')
}

const cmd = process.argv[2]
if (cmd === 'strip') stripWorkspaceDeps()
if (cmd === 'restore') restorePackageJson()
