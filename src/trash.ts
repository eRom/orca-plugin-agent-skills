// Corbeille macOS et exécution de binaires, sans shell.
import { execFile } from 'node:child_process'

export type ExecResult = { code: number; stdout: string; stderr: string }
export type ExecRunner = (file: string, args: readonly string[]) => Promise<ExecResult>
export type Trasher = (paths: readonly string[]) => Promise<void>

export const TRASH_BIN = '/usr/bin/trash'

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

/** Corbeille système : uniquement sur macOS et si `/usr/bin/trash` existe, sinon `null`. */
export function systemTrasher(platform: string, exists: (path: string) => boolean, run: ExecRunner): Trasher | null {
  if (platform !== 'darwin' || !exists(TRASH_BIN)) return null
  return async (paths) => {
    const { code, stderr } = await run(TRASH_BIN, paths)
    if (code !== 0) throw new Error(stderr.trim() || `trash exited with code ${code}`)
  }
}
