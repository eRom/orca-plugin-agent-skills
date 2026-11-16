// Chemins saisis par l'utilisateur : reconnaissance, résolution, abréviation du home, appartenance.
import { isAbsolute, relative, resolve, sep } from 'node:path'

/** Vrai si le texte est un chemin (`/x`, `~`, `~/x`, `./x`, `../x`) et non une source du type `owner/repo`. */
export function isPathInput(text: string): boolean {
  return text.startsWith('/') || text === '~' || text.startsWith('~/') || text.startsWith('./') || text.startsWith('../')
}

/** Chemin absolu normalisé : `~` devient le home, un chemin relatif part de `root`, la barre finale disparaît. */
export function resolveInputPath(text: string, root: string, home: string): string {
  if (text === '~') return resolve(home)
  if (text.startsWith('~/')) return resolve(home, text.slice(2))
  return resolve(root, text)
}

/** Remplace le home par `~`, seulement sur une frontière de chemin (`/Users/meow` n'est pas sous `/Users/me`). */
export function abbreviateHome(path: string, home: string): string {
  const base = home.length > 1 ? home.replace(/\/+$/, '') : home
  if (path === base) return '~'
  if (base !== '/' && path.startsWith(`${base}/`)) return `~${path.slice(base.length)}`
  return path
}

/** Vrai si `child` est `parent` ou se trouve dessous. Les deux chemins doivent être réels (`realpath`). */
export function isInside(child: string, parent: string): boolean {
  const rel = relative(parent, child)
  if (rel === '') return true
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}
