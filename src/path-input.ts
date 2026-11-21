// Reconnaissance d'un chemin tapé, sans aucun import : le panneau l'utilise, et il ne peut importer ni `node:path` ni un paquet.

/**
 * Vrai si le texte est un chemin (`/x`, `~`, `~/x`, `./x`, `../x`) et non une source du type `owner/repo`. Sous Windows
 * (`platform === 'win32'`), les formes `C:\x`, `C:/x`, `\\srv\share`, `.\x`, `..\x` et `~\x` en sont aussi ; `C:` seul
 * ou `C:skills` (relatif au lecteur) n'en sont pas.
 */
export function isPathInput(text: string, platform: string): boolean {
  if (text.startsWith('/') || text === '~' || text.startsWith('~/') || text.startsWith('./') || text.startsWith('../')) return true
  if (platform !== 'win32') return false
  return /^[A-Za-z]:[\\/]/.test(text) || text.startsWith('\\\\') || text.startsWith('.\\') || text.startsWith('..\\') || text.startsWith('~\\')
}
