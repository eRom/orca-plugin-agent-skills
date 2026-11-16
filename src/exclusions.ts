// Exclusions par projet : les agents qu'une skill ne doit plus nourrir après un « Retirer d'ici ». Pur, sans accès disque.
import type { SkillRow } from './visibility'

/** projet (`projectId`) -> nom de dossier de la skill -> agents exclus. Jamais de liste vide ni de doublon. */
export type Exclusions = Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>

/** Clé du stockage du plugin (`storage:own`). */
export const EXCLUSIONS_KEY = 'exclusions.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Réduit une table à ses entrées non vides ; `Object.fromEntries` définit des clés propres, même `__proto__`. */
function compact<T>(entries: Iterable<[string, T | null]>): Record<string, T> {
  return Object.fromEntries([...entries].filter((entry): entry is [string, T] => entry[1] !== null))
}

/** Relit la valeur du stockage ; toute forme invalide donne `{}` (jamais de demi-lecture). Retire listes vides et doublons. */
export function parseExclusions(raw: unknown): Exclusions {
  if (!isRecord(raw)) return {}
  const projects: [string, Record<string, readonly string[]> | null][] = []
  for (const [projectKey, skills] of Object.entries(raw)) {
    if (!isRecord(skills)) return {}
    const folders: [string, readonly string[] | null][] = []
    for (const [folder, agents] of Object.entries(skills)) {
      if (!Array.isArray(agents) || !agents.every((agent) => typeof agent === 'string')) return {}
      const unique = [...new Set(agents as string[])]
      folders.push([folder, unique.length > 0 ? unique : null])
    }
    const kept = compact(folders)
    projects.push([projectKey, Object.keys(kept).length > 0 ? kept : null])
  }
  return compact(projects)
}

/** Agents exclus de la skill `folder` dans le projet (liste vide si aucun). */
export function excludedOf(ex: Exclusions, projectKey: string, folder: string): readonly string[] {
  if (!Object.hasOwn(ex, projectKey)) return []
  const skills = ex[projectKey]!
  return Object.hasOwn(skills, folder) ? skills[folder]! : []
}

/** Remplace la liste d'une skill (vide : l'entrée disparaît, et le projet avec s'il n'a plus rien). Ne modifie jamais `ex`. */
function withAgents(ex: Exclusions, projectKey: string, folder: string, agents: readonly string[]): Exclusions {
  const skills = Object.hasOwn(ex, projectKey) ? ex[projectKey]! : {}
  const nextSkills = compact<readonly string[]>([
    ...Object.entries(skills).filter(([name]) => name !== folder),
    [folder, agents.length > 0 ? agents : null]
  ])
  const others = Object.entries(ex).filter(([key]) => key !== projectKey)
  return compact<Readonly<Record<string, readonly string[]>>>([...others, [projectKey, Object.keys(nextSkills).length > 0 ? nextSkills : null]])
}

/** Ajoute des agents à l'exclusion de la skill (sans doublon, ordre d'arrivée conservé). */
export function exclude(ex: Exclusions, projectKey: string, folder: string, agents: readonly string[]): Exclusions {
  return withAgents(ex, projectKey, folder, [...new Set([...excludedOf(ex, projectKey, folder), ...agents])])
}

/** Retire des agents de l'exclusion de la skill ; sans `agents`, toute l'exclusion de la skill tombe. */
export function include(ex: Exclusions, projectKey: string, folder: string, agents?: readonly string[]): Exclusions {
  const current = excludedOf(ex, projectKey, folder)
  const left = agents ? current.filter((agent) => !agents.includes(agent)) : []
  return withAgents(ex, projectKey, folder, left)
}

/**
 * Lève l'exclusion des agents qui voient de nouveau la skill sur le disque (le disque prime). Renvoie `ex` lui-même
 * si rien ne change, pour que l'appelant sache sans comparer s'il doit réécrire le stockage. Les skills absentes de
 * `rows` ne sont pas touchées : un autre worktree du projet peut encore les porter.
 */
export function pruneSeen(ex: Exclusions, projectKey: string, rows: readonly SkillRow[]): Exclusions {
  let next = ex
  for (const row of rows) {
    const current = excludedOf(next, projectKey, row.folder)
    const seen = row.agents.filter((a) => a.state === 'sees' && current.includes(a.agent)).map((a) => a.agent)
    if (seen.length > 0) next = include(next, projectKey, row.folder, seen)
  }
  return next
}
