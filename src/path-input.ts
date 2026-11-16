// Reconnaissance d'un chemin tapé, sans aucun import : le panneau l'utilise, et il ne peut importer ni `node:path` ni un paquet.

/** Vrai si le texte est un chemin (`/x`, `~`, `~/x`, `./x`, `../x`) et non une source du type `owner/repo`. */
export function isPathInput(text: string): boolean {
  return text.startsWith('/') || text === '~' || text.startsWith('~/') || text.startsWith('./') || text.startsWith('../')
}
