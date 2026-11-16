// Sélecteur de dossier natif macOS, via osascript.
import type { ExecRunner } from './trash'

const OSASCRIPT_BIN = '/usr/bin/osascript'
const CHOOSE_FOLDER = 'POSIX path of (choose folder)'
/** Code AppleScript d'une boîte annulée : stable, contrairement au message localisé. */
const USER_CANCELLED = '(-128)'

/** Sélecteur de dossier : `null` hors macOS. La fonction rendue donne le chemin choisi, ou `null` si l'utilisateur annule. */
export function folderPicker(platform: string, run: ExecRunner): (() => Promise<string | null>) | null {
  if (platform !== 'darwin') return null
  return async () => {
    const { code, stdout, stderr } = await run(OSASCRIPT_BIN, ['-e', CHOOSE_FOLDER])
    if (code === 0) return stdout.replace(/\r?\n$/, '')
    if (stderr.includes(USER_CANCELLED)) return null
    throw new Error(stderr.trim() || `osascript exited with code ${code}`)
  }
}
