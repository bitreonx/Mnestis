/**
 * Veil — scoped team memory access (GBrain company-brain pattern).
 * Every episode can carry scope; queries filter by the active actor.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { MemoryEpisode, MemoryScope, VeilActor, VeilPolicy, VeilVisibility } from './types.js';

export const VEIL_SCHEMA = 'mnemos/veil/v1';
const VEIL_FILE = 'veil.json';

const DEFAULT_ACTOR: VeilActor = {
  id: 'local',
  displayName: 'Local Developer',
  role: 'owner',
  teams: ['*'],
  clients: ['*'],
};

export function defaultVeilPolicy(actor?: Partial<VeilActor>): VeilPolicy {
  const now = new Date().toISOString();
  return {
    $schema: VEIL_SCHEMA,
    actor: { ...DEFAULT_ACTOR, ...actor, teams: actor?.teams ?? DEFAULT_ACTOR.teams, clients: actor?.clients ?? DEFAULT_ACTOR.clients },
    defaultVisibility: 'private',
    enforceAtQuery: true,
    updatedAt: now,
  };
}

export function veilPath(engineDir: string): string {
  return path.join(engineDir, VEIL_FILE);
}

export async function loadVeilPolicy(engineDir: string): Promise<VeilPolicy | null> {
  try {
    const raw = await readFile(veilPath(engineDir), 'utf-8');
    return JSON.parse(raw) as VeilPolicy;
  } catch {
    return null;
  }
}

export async function saveVeilPolicy(engineDir: string, policy: VeilPolicy): Promise<void> {
  await mkdir(engineDir, { recursive: true });
  await writeFile(veilPath(engineDir), JSON.stringify({ ...policy, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
}

function actorCanAccess(actor: VeilActor, scope: MemoryScope): boolean {
  if (actor.role === 'owner') return true;
  if (scope.owner === actor.id) return true;

  const vis = scope.visibility;
  if (vis === 'private') return scope.owner === actor.id;
  if (vis === 'org') return true;

  if (vis === 'team') {
    if (!scope.team) return actor.role === 'lead';
    return actor.teams.includes('*') || actor.teams.includes(scope.team);
  }

  if (vis === 'client') {
    if (!scope.client) return actor.role === 'lead';
    return actor.clients.includes('*') || actor.clients.includes(scope.client);
  }

  return false;
}

export function applyVeilToEpisodes(episodes: MemoryEpisode[], policy: VeilPolicy | null): MemoryEpisode[] {
  if (!policy?.enforceAtQuery) return episodes;
  return episodes.filter((ep) => {
    if (!ep.scope) return ep.source === 'build' || policy.actor.role === 'owner';
    return actorCanAccess(policy.actor, ep.scope);
  });
}

export function resolveEpisodeScope(
  policy: VeilPolicy | null,
  overrides?: Partial<MemoryScope>,
): MemoryScope | undefined {
  if (!policy && !overrides) return undefined;
  const base = policy?.actor;
  const scope: MemoryScope = {
    owner: overrides?.owner ?? base?.id ?? 'local',
    team: overrides?.team ?? base?.teams[0],
    client: overrides?.client,
    project: overrides?.project,
    visibility: overrides?.visibility ?? policy?.defaultVisibility ?? 'private',
  };
  return scope;
}

export function parseVisibility(value: string): VeilVisibility | null {
  const v = value.toLowerCase();
  if (v === 'private' || v === 'team' || v === 'client' || v === 'org') return v;
  return null;
}

export function formatVeilStatus(policy: VeilPolicy | null): string {
  if (!policy) return 'Veil: inactive (all episodes visible to local owner)';
  const a = policy.actor;
  return [
    `Veil · actor ${a.id} (${a.role})`,
    `  teams: ${a.teams.join(', ')}`,
    `  clients: ${a.clients.join(', ')}`,
    `  default visibility: ${policy.defaultVisibility}`,
    `  enforce at query: ${policy.enforceAtQuery}`,
  ].join('\n');
}
