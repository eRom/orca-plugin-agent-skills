// Inventaire des agents installés, sans shell. Deux sources, dans cet ordre (spec §5.1) :
// 1. l'historique d'Orca (`agent.listSessions`, voir `history.ts`) pour les agents qu'il sait lire (`HISTORY_AGENTS`) ;
// 2. les dossiers de config : la détection de la bibliothèque `skills` (`libIds`) et le complément du plugin
//    (`configDirs`, docs/agent-skill-dirs.md), pour les autres agents ou quand l'historique est vide.
// Les fichiers privés d'Orca ne sont jamais lus (demande de la revue de l'annuaire, issue #1).
import { join } from 'node:path'
import { AGENTS, HISTORY_AGENTS } from './agents'

export type DetectionSource = 'history' | 'dirs'
export type Inventory = { agents: string[]; source: DetectionSource; detectedAt: number }
export type InventoryDeps = {
  /** Identifiants skills.sh des agents que la bibliothèque détecte depuis `home`. */
  libAgents: (home: string) => Promise<ReadonlySet<string>>
  exists: (path: string) => boolean
  now: () => number
}

/**
 * Agents installés, dans l'ordre du catalogue d'Orca. Un historique non vide (après retrait des identifiants inconnus)
 * décide seul pour les agents qu'il sait voir ; les dossiers décident pour les autres, et pour tous quand il est vide.
 * Un identifiant du catalogue rendu par l'historique compte même hors `HISTORY_AGENTS` : la liste d'Orca peut grandir
 * avant la nôtre.
 */
export function installedAgents(
  history: ReadonlySet<string> | null,
  lib: ReadonlySet<string>,
  hasConfigDir: (homeRelative: string) => boolean
): { agents: string[]; source: DetectionSource } {
  const seen = new Set<string>()
  for (const spec of AGENTS) if (history?.has(spec.id)) seen.add(spec.id)
  const useHistory = seen.size > 0
  const agents = AGENTS.filter((spec) => {
    if (useHistory && seen.has(spec.id)) return true
    if (useHistory && HISTORY_AGENTS.has(spec.id)) return false
    return spec.libIds.some((id) => lib.has(id)) || spec.configDirs.some((dir) => hasConfigDir(dir))
  }).map((spec) => spec.id)
  return { agents, source: useHistory ? 'history' : 'dirs' }
}

/** Une détection complète. Une bibliothèque en échec vaut un ensemble vide : l'historique garde tout son effet. */
export async function detectAgents(
  deps: InventoryDeps,
  home: string,
  history: () => Promise<ReadonlySet<string> | null>,
  log: (line: string) => void
): Promise<Inventory> {
  const [seen, lib] = await Promise.all([
    history(),
    deps.libAgents(home).catch((): ReadonlySet<string> => {
      log('config dirs: library detection failed')
      return new Set()
    })
  ])
  const { agents, source } = installedAgents(seen, lib, (dir) => deps.exists(join(home, dir)))
  return { agents, source, detectedAt: deps.now() }
}
