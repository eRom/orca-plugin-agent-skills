// Chemins saisis par l'utilisateur : reconnaissance, résolution, abréviation du home, appartenance.
import * as nodePath from 'node:path'

// Défini dans un module sans import (le panneau ne peut pas importer `node:path`), repris ici pour les autres appelants.
export { isPathInput } from './path-input'

/** L'API de chemins à employer ; le défaut est le module natif (win32 sous Windows), jamais `posix` en dur. */
export type PathApi = typeof import('node:path').posix

/** Chemin absolu normalisé : `~` devient le home, un chemin relatif part de `root`, la barre finale disparaît. */
export function resolveInputPath(text: string, root: string, home: string, path: PathApi = nodePath): string {
  if (text === '~') return path.resolve(home)
  if (text.startsWith('~/') || (path.sep === '\\' && text.startsWith('~\\'))) return path.resolve(home, text.slice(2))
  return path.resolve(root, text)
}

/** Remplace le home par `~`, seulement sur une frontière de chemin (`/Users/meow` n'est pas sous `/Users/me`). */
export function abbreviateHome(path: string, home: string, pathApi: PathApi = nodePath): string {
  const win = pathApi.sep === '\\'
  const trimmed = home.length > 1 ? home.replace(win ? /[\\/]+$/ : /\/+$/, '') : home
  // Windows : la casse du lecteur et le type de barre ne comptent pas pour reconnaître le home.
  const norm = (value: string): string => (win ? value.replace(/\//g, '\\').toLowerCase() : value)
  const base = norm(trimmed)
  const subject = norm(path)
  if (subject === base) return '~'
  if (base !== pathApi.sep && subject.startsWith(`${base}${pathApi.sep}`)) return `~${path.slice(trimmed.length)}`
  return path
}

/** Vrai pour un chemin réseau Windows (`\\serveur\partage`, `\\wsl.localhost\…`) ; jamais ailleurs que sous Windows. */
export function isNetworkPath(path: string, platform: string): boolean {
  return platform === 'win32' && path.startsWith('\\\\')
}

/** Vrai si `child` est `parent` ou se trouve dessous. Les deux chemins doivent être réels (`realpath`). */
export function isInside(child: string, parent: string): boolean {
  const rel = nodePath.relative(parent, child)
  if (rel === '') return true
  return rel !== '..' && !rel.startsWith(`..${nodePath.sep}`) && !nodePath.isAbsolute(rel)
}
