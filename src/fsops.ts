// Opérations disque sur une skill : empreinte de contenu et copie réelle (jamais de lien créé).
import { createHash } from 'node:crypto'
import { copyFile, lstat, mkdir, readdir, readFile, readlink, realpath, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { isInside } from './paths'

const IGNORED = '.DS_Store'
const MAX_DEPTH = 24

/**
 * Empreinte SHA-256 d'une skill : chemins relatifs triés et octets des fichiers, `.DS_Store` exclu. Un lien à
 * l'intérieur est haché par sa cible textuelle (jamais suivi : pas de cycle), les niveaux au-delà de 24 sont ignorés.
 */
export async function contentHash(dir: string): Promise<string> {
  const hash = createHash('sha256')
  async function walk(current: string, prefix: string, depth: number): Promise<void> {
    const names = (await readdir(current)).filter((name) => name !== IGNORED).sort()
    for (const name of names) {
      const full = join(current, name)
      const rel = prefix === '' ? name : `${prefix}/${name}`
      const info = await lstat(full)
      if (info.isSymbolicLink()) {
        hash.update(`L\0${rel}\0${await readlink(full)}\0`)
      } else if (info.isDirectory()) {
        if (depth + 1 > MAX_DEPTH) continue
        hash.update(`D\0${rel}\0`)
        await walk(full, rel, depth + 1)
      } else if (info.isFile()) {
        hash.update(`F\0${rel}\0${info.size}\0`)
        hash.update(await readFile(full))
        hash.update('\0')
      }
    }
  }
  await walk(dir, '', 0)
  return hash.digest('hex')
}

/**
 * Copie réelle d'une skill vers `to` : le lien de tête est suivi, aucun lien n'est créé. Un lien interne vers un
 * fichier de la skill est copié comme un fichier ; un lien qui sort de la skill, vers un dossier ou cassé est ignoré.
 * Refuse une destination existante (`code === 'EEXIST'`, y compris un lien cassé). Une copie qui échoue est retirée.
 */
export async function copySkill(from: string, to: string): Promise<void> {
  const source = await realpath(from)
  await mkdir(dirname(to), { recursive: true })
  await mkdir(to) // non récursif : lève EEXIST si la destination existe déjà
  async function copyDir(current: string, target: string, depth: number): Promise<void> {
    for (const name of await readdir(current)) {
      if (name === IGNORED) continue
      const full = join(current, name)
      const out = join(target, name)
      const info = await lstat(full)
      if (info.isDirectory()) {
        if (depth + 1 > MAX_DEPTH) continue
        await mkdir(out)
        await copyDir(full, out, depth + 1)
      } else if (info.isFile()) {
        await copyFile(full, out)
      } else if (info.isSymbolicLink()) {
        const real = await realpath(full).catch(() => null)
        if (real === null || !isInside(real, source)) continue
        if ((await stat(real)).isFile()) await copyFile(real, out)
      }
    }
  }
  try {
    await copyDir(source, to, 0)
  } catch (error) {
    await rm(to, { recursive: true, force: true })
    throw error
  }
}
