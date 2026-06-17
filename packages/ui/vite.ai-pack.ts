import path from 'node:path'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildAiPack,
  filterBySection,
  aiPackToJson,
  AI_PACK_VERSION,
  AI_PACK_SCHEMA,
  type AiPackSection,
  type Mode,
} from '../core/dist/index.js'
import type { MemoryModel } from '../core/dist/types.js'

async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(await readFile(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

export async function buildAiPackFromDir(
  mnemosDir: string,
  options: {
    repoId: string
    root: string
    section?: string
    mode?: string
  },
): Promise<{ body: string; status: number }> {
  const memory = await readJsonSafe<MemoryModel>(path.join(mnemosDir, 'memory.json'))
  if (!memory) {
    return { status: 404, body: JSON.stringify({ error: 'Memory not found. Run mnemos build first.' }) }
  }

  const dna = await readJsonSafe<Record<string, unknown>>(path.join(mnemosDir, 'project.dna.json'))
  const section = (options.section ?? 'all') as AiPackSection
  const mode = (options.mode ?? 'ai') as Mode

  const pack = buildAiPack(memory, {
    repoId: options.repoId,
    root: options.root,
    mode,
    dna: dna ?? undefined,
  })

  const filtered = filterBySection(pack, section)
  const body = aiPackToJson(filtered)

  return { status: 200, body }
}

export function aiPackHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'X-Mnemos-AiPack-Version': AI_PACK_VERSION,
    'X-Mnemos-AiPack-Schema': AI_PACK_SCHEMA,
  }
}

export function parseAiPackQuery(url: string): { section?: string; mode?: string } {
  const u = new URL(url, 'http://local')
  return {
    section: u.searchParams.get('section') ?? undefined,
    mode: u.searchParams.get('mode') ?? undefined,
  }
}
