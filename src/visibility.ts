// Modèle de visibilité : pour chaque skill du disque, ce que chaque agent actif en voit. Pur, sans accès disque.
import { abbreviateHome } from './paths'
import type { CopyKind, DiskSkill, ScanResult, SkillCopy } from './scan'
import { MANAGED_DIRS, readers, skillCapable, type ManagedDir } from './skill-dirs'

/** Entrée du lock du projet pour une skill (clé de la map : le nom de dossier de la skill). */
export type LockEntry = { source: string; libName: string }

export type SourceLabel = { kind: 'remote'; source: string } | { kind: 'local'; path: string } | { kind: 'handwritten' }

/** `via` : dossiers gérés qui portent une copie de la skill et que cet agent lit, dans l'ordre de `MANAGED_DIRS`. */
export type AgentState = { agent: string; state: 'sees' | 'absent' | 'excluded'; via: ManagedDir[] }

/** Un contenu distinct de la skill et les dossiers qui le portent. */
export type SkillVersion = { hash: string; dirs: ManagedDir[] }

/** `feeds` : agents actifs qui lisent ce dossier. `linkedFrom` : dossiers dont la copie est un lien interne vers celle-ci. */
export type DirCopyView = { dir: ManagedDir; kind: CopyKind; feeds: string[]; linkedFrom: ManagedDir[] }

export type SkillRow = {
  folder: string
  displayName: string
  description: string
  source: SourceLabel
  agents: AgentState[]
  missingFor: string[]
  excluded: string[]
  versions: SkillVersion[]
  copies: DirCopyView[]
}

/** Une source qui commence par `/` est un chemin local (abrégé en `~`), sinon une source distante ; sans entrée : écrite à la main. */
export function sourceLabel(entry: LockEntry | undefined, home: string): SourceLabel {
  if (!entry) return { kind: 'handwritten' }
  if (entry.source.startsWith('/')) return { kind: 'local', path: abbreviateHome(entry.source, home) }
  return { kind: 'remote', source: entry.source }
}

const dirOrder = (copy: SkillCopy): number => MANAGED_DIRS.indexOf(copy.dir)

/** Contenu d'une copie : un lien interne vaut le contenu de sa cible, il ne fait jamais une version de plus. */
function contentOf(copy: SkillCopy, copies: readonly SkillCopy[]): string {
  if (copy.kind !== 'internal-link') return copy.hash
  const target = copies.find((other) => other.kind === 'dir' && other.realPath === copy.realPath)
  return target ? target.hash : copy.hash
}

function versionsOf(copies: readonly SkillCopy[]): SkillVersion[] {
  const byHash = new Map<string, ManagedDir[]>()
  for (const copy of copies) {
    const hash = contentOf(copy, copies)
    const dirs = byHash.get(hash)
    if (dirs) dirs.push(copy.dir)
    else byHash.set(hash, [copy.dir])
  }
  return [...byHash].map(([hash, dirs]) => ({ hash, dirs }))
}

function buildRow(
  disk: DiskSkill,
  source: SourceLabel,
  active: readonly string[],
  excludedAgents: ReadonlySet<string>
): SkillRow {
  // Les copies sont reprises dans l'ordre de `MANAGED_DIRS`, quel que soit l'ordre du balayage.
  const copies = [...disk.copies].sort((a, b) => dirOrder(a) - dirOrder(b))
  const heldDirs = new Set(copies.map((copy) => copy.dir))

  const agents: AgentState[] = active.map((agent) => {
    const via = MANAGED_DIRS.filter((dir) => heldDirs.has(dir) && readers(dir, [agent]).length > 0)
    // Le disque prime sur l'exclusion : un agent qui voit la skill n'est jamais « exclu ».
    const state = via.length > 0 ? 'sees' : excludedAgents.has(agent) ? 'excluded' : 'absent'
    return { agent, state, via }
  })

  return {
    folder: disk.folder,
    displayName: disk.displayName,
    description: disk.description,
    source,
    agents,
    missingFor: agents.filter((a) => a.state === 'absent').map((a) => a.agent),
    excluded: agents.filter((a) => a.state === 'excluded').map((a) => a.agent),
    versions: versionsOf(copies),
    copies: copies.map((copy) => ({
      dir: copy.dir,
      kind: copy.kind,
      feeds: readers(copy.dir, active),
      // Un lien interne a le chemin réel de sa cible : seule une vraie copie peut recevoir des liens.
      linkedFrom:
        copy.kind === 'dir'
          ? copies.filter((o) => o.kind === 'internal-link' && o.realPath === copy.realPath && o.dir !== copy.dir).map((o) => o.dir)
          : []
    }))
  }
}

/**
 * Une ligne par skill du balayage, dans son ordre. `active` est filtré aux agents qui gèrent les skills (ordre conservé) ;
 * `lock` est indexé par nom de dossier ; `exclusionsFor` donne les agents exclus d'une skill dans ce projet.
 */
export function buildRows(
  scan: ScanResult,
  lock: ReadonlyMap<string, LockEntry>,
  active: readonly string[],
  exclusionsFor: (folder: string) => readonly string[],
  home: string
): SkillRow[] {
  const capable = skillCapable(active)
  return scan.skills.map((disk) => buildRow(disk, sourceLabel(lock.get(disk.folder), home), capable, new Set(exclusionsFor(disk.folder))))
}
