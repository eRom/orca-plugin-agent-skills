// Balayage du disque : les skills présentes dans les dossiers gérés d'un projet, fusionnées par nom de dossier.
import { lstat, readdir, readFile, realpath, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { contentHash } from './fsops'
import { type Frontmatter, parseFrontmatter } from './frontmatter'
import { MANAGED_DIRS, type ManagedDir } from './skill-dirs'

export type CopyKind = 'dir' | 'internal-link' | 'external-link'

/** Un exemplaire d'une skill dans un dossier géré : `path` est l'entrée elle-même (le lien, le cas échéant). */
export type SkillCopy = { dir: ManagedDir; path: string; kind: CopyKind; realPath: string; hash: string }

export type DiskSkill = { folder: string; displayName: string; description: string; copies: SkillCopy[] }

/** `unsafeDirs` : dossiers gérés dont le chemin réel sort du projet. Leurs entrées ne sont jamais lues. */
export type ScanResult = { skills: DiskSkill[]; unsafeDirs: ManagedDir[] }

async function isDirectory(path: string): Promise<boolean> {
  return (await stat(path).catch(() => null))?.isDirectory() ?? false
}

/** Un exemplaire de skill pour l'entrée `name` de `dir`, ou `null` si ce n'est pas une skill (peut lever sur une erreur disque). */
async function readEntry(
  root: string,
  dir: ManagedDir,
  dirReal: string,
  name: string,
  safeDirs: ReadonlyMap<ManagedDir, string>
): Promise<{ copy: SkillCopy; meta: Frontmatter } | null> {
  const entry = join(dirReal, name)
  const info = await lstat(entry)
  const realPath = await realpath(entry).catch(() => null) // null : lien cassé ou en boucle
  if (realPath === null || !(await isDirectory(realPath))) return null
  const skillFile = join(realPath, 'SKILL.md')
  if (!(await stat(skillFile).catch(() => null))?.isFile()) return null

  let kind: CopyKind = 'dir'
  if (info.isSymbolicLink()) {
    const internal = [...safeDirs.values()].some((safe) => realPath === join(safe, name))
    kind = internal ? 'internal-link' : 'external-link'
  }
  const meta = parseFrontmatter(await readFile(skillFile, 'utf8'))
  const copy: SkillCopy = { dir, path: join(root, dir, name), kind, realPath, hash: await contentHash(realPath) }
  return { copy, meta }
}

/** Parcourt les dossiers gérés de `root` (jamais le `skills/` racine) et regroupe les exemplaires par dossier. */
export async function scanWorkspace(root: string): Promise<ScanResult> {
  const rootReal = await realpath(root).catch(() => null)
  if (rootReal === null) return { skills: [], unsafeDirs: [] }

  const safeDirs = new Map<ManagedDir, string>()
  const unsafeDirs: ManagedDir[] = []
  for (const dir of MANAGED_DIRS) {
    const expected = join(rootReal, dir)
    const real = await realpath(expected).catch(() => null)
    if (real === null || !(await isDirectory(real))) continue
    // Sûr seulement sans alias à aucun niveau : un `.claude` ou un `skills` lié, même vers un autre endroit du projet,
    // ferait lister un autre dossier (ou doubler les skills) et viser des fichiers que ce dossier ne possède pas.
    if (real === expected) safeDirs.set(dir, real)
    else unsafeDirs.push(dir)
  }

  const byFolder = new Map<string, DiskSkill>()
  for (const [dir, dirReal] of safeDirs) {
    const names = (await readdir(dirReal).catch(() => [])).sort()
    for (const name of names) {
      // Une entrée illisible ou disparue pendant le balayage est ignorée : elle ne fait pas échouer les autres.
      const found = await readEntry(root, dir, dirReal, name, safeDirs).catch(() => null)
      if (!found) continue
      const { copy, meta } = found
      const known = byFolder.get(name)
      if (!known) {
        byFolder.set(name, { folder: name, displayName: meta.name || name, description: meta.description ?? '', copies: [copy] })
      } else {
        known.copies.push(copy)
        if (known.displayName === name && meta.name) known.displayName = meta.name
        if (known.description === '' && meta.description) known.description = meta.description
      }
    }
  }
  return { skills: [...byFolder.values()].sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0)), unsafeDirs }
}
