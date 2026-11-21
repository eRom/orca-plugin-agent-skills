// Corbeille par OS et exécution de binaires, sans shell.
import { execFile } from 'node:child_process'

export type ExecResult = { code: number; stdout: string; stderr: string }
export type ExecRunner = (file: string, args: readonly string[]) => Promise<ExecResult>
export type Trasher = (paths: readonly string[]) => Promise<void>

/**
 * État de la Corbeille : `ready` (utilisable), `unverified` (l'OS n'est pas encore vérifié, ou n'a aucun moyen en v0.2),
 * `missing` (binaire absent, ou OS inconnu), `network` (espace sur un chemin réseau, décidé par le worker).
 */
export type TrashStatus = 'ready' | 'unverified' | 'missing' | 'network'

export const TRASH_BIN = '/usr/bin/trash'
export const GIO_BIN = '/usr/bin/gio'

/**
 * OS dont la Corbeille a été vérifiée sur une vraie machine. Un OS y entre par un commit à part qui cite la preuve
 * (spec §5.2) : tant qu'il n'y est pas, les gestes qui retirent ou écrasent sont refusés, rien n'est jamais supprimé pour de bon.
 */
export const TRASH_VERIFIED: ReadonlySet<string> = new Set(['darwin'])

/** Lance un binaire par `execFile` (jamais de shell). Un code de sortie non nul est un résultat, pas une exception. */
export const execRunner: ExecRunner = (file, args) =>
  new Promise((resolve, reject) => {
    execFile(file, [...args], { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (!error) return resolve({ code: 0, stdout, stderr })
      const code = (error as NodeJS.ErrnoException & { code?: unknown }).code
      // Un code numérique est le statut de sortie ; une chaîne (ENOENT, ...) est un échec de lancement.
      if (typeof code === 'number') return resolve({ code, stdout, stderr })
      reject(error)
    })
  })

/** Le binaire et les arguments qui mettent `paths` à la Corbeille sur cet OS (`--` : un chemin n'est jamais une option). */
const COMMANDS: Record<string, { bin: string; args: (paths: readonly string[]) => string[] }> = {
  darwin: { bin: TRASH_BIN, args: (paths) => [...paths] },
  linux: { bin: GIO_BIN, args: (paths) => ['trash', '--', ...paths] }
}

/**
 * Corbeille système. Windows n'a aucun moyen en v0.2 (`unverified`, rien n'est lancé), un OS inconnu est `missing`.
 * Sur macOS et Linux, le trasher n'existe que si l'OS est dans `verified` et que son binaire est présent.
 */
export function systemTrasher(
  platform: string,
  exists: (path: string) => boolean,
  run: ExecRunner,
  verified: ReadonlySet<string> = TRASH_VERIFIED
): { trasher: Trasher | null; status: 'ready' | 'unverified' | 'missing' } {
  if (platform === 'win32') return { trasher: null, status: 'unverified' }
  const command = Object.prototype.hasOwnProperty.call(COMMANDS, platform) ? COMMANDS[platform] : undefined
  if (!command) return { trasher: null, status: 'missing' }
  if (!verified.has(platform)) return { trasher: null, status: 'unverified' }
  if (!exists(command.bin)) return { trasher: null, status: 'missing' }
  const trasher: Trasher = async (paths) => {
    const { code, stderr } = await run(command.bin, command.args(paths))
    if (code !== 0) throw new Error(stderr.trim() || `${command.bin} exited with code ${code}`)
  }
  return { trasher, status: 'ready' }
}
