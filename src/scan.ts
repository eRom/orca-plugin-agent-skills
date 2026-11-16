// Balayage du disque : les skills présentes dans les dossiers gérés d'un projet, fusionnées par nom de dossier.
import { lstat, readdir, readFile, realpath, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { contentHash } from './fsops'
import { parseFrontmatter } from './frontmatter'
import { isInside } from './paths'
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

/** Parcourt les dossiers gérés de `root` (jamais le `skills/` racine) et regroupe les exemplaires par dossier. */
export async function scanWorkspace(root: string): Promise<ScanResult> {
  const rootReal = await realpath(root).catch(() => null)
  if (rootReal === null) return { skills: [], unsafeDirs: [] }

  const safeDirs = new Map<ManagedDir, string>()
  const unsafeDirs: ManagedDir[] = []
  for (const dir of MANAGED_DIRS) {
    const real = await realpath(join(rootReal, dir)).catch(() => null)
    if (real === null || !(await isDirectory(real))) continue
    if (isInside(real, rootReal)) safeDirs.set(dir, real)
    else unsafeDirs.push(dir)
  }

  const byFolder = new Map<string, DiskSkill>()
  for (const [dir, dirReal] of safeDirs) {
    const names = (await readdir(dirReal)).sort()
    for (const name of names) {
      const path = join(root, dir, name)
      const entry = join(dirReal, name)
      const info = await lstat(entry).catch(() => null)
      const realPath = info ? await realpath(entry).catch(() => null) : null // null : lien cassé ou en boucle
      if (!info || realPath === null || !(await isDirectory(realPath))) continue
      const skillFile = join(realPath, 'SKILL.md')
      if (!(await stat(skillFile).catch(() => null))?.isFile()) continue

      let kind: CopyKind = 'dir'
      if (info.isSymbolicLink()) {
        const internal = [...safeDirs.values()].some((safe) => realPath === join(safe, name))
        kind = internal ? 'internal-link' : 'external-link'
      }
      const meta = parseFrontmatter(await readFile(skillFile, 'utf8'))
      const copy: SkillCopy = { dir, path, kind, realPath, hash: await contentHash(realPath) }
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
