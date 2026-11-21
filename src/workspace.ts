// Espace de travail focalisé : l'identifiant vient de `workspace.readContext`, le chemin et l'hôte de `workspace.list`.
import { lstat, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import type { OrcaWorkerApi } from 'orca/worker'
import { isNetworkPath } from './paths'

/** Le `call` typé du worker : seul point d'entrée vers l'hôte, injecté pour que les tests n'aient pas besoin d'Orca. */
export type HostCall = OrcaWorkerApi['host']['call']

/** `id` : identifiant de l'espace ; le panneau le renvoie avec chaque demande pour que le worker refuse d'agir sur un autre espace. */
export type WorkspaceView =
  | { status: 'none' | 'remote' | 'missing' | 'home' | 'wsl' }
  | { status: 'ready'; id: string; name: string; branch: string | null; linkedWorktree: boolean; network: boolean }

/** `projectKey` : identifiant du projet (`projectId`), commun à tous ses worktrees ; l'identifiant de l'espace à défaut. */
export type FocusedWorkspace = { root: string; projectKey: string; view: WorkspaceView }

/**
 * Forme de la racine d'un espace : lecteur (`C:\…`), partage réseau (`\\hôte\…`), racine POSIX (`/…`) ou autre (relatif, illisible).
 * Seule la forme est journalisée, jamais le chemin.
 */
export function classifyRoot(path: string, platform: string): 'drive' | 'unc' | 'posix' | 'other' {
  if (isNetworkPath(path, platform)) return 'unc'
  if (/^[A-Za-z]:[\\/]/.test(path)) return 'drive'
  if (path.startsWith('/')) return 'posix'
  return 'other'
}

const isRemoteHost = (hostId: string | null): boolean => hostId !== null && (hostId.startsWith('ssh:') || hostId.startsWith('runtime:'))

/** Un worktree lié a un fichier `.git` (un dossier `.git` est celui du dépôt principal). */
async function isLinkedWorktree(root: string): Promise<boolean> {
  return (await lstat(join(root, '.git')).catch(() => null))?.isFile() ?? false
}

/**
 * Espace focalisé et ce qu'on peut en faire. Seul le statut `ready` porte un `root` : tout autre statut interdit balayage et gestes.
 * Un espace sans ligne dans `workspace.list` compte pour aucun (l'hôte n'en donne alors ni chemin ni hôte).
 */
export async function resolveWorkspace(
  call: HostCall,
  home: string,
  platform: string,
  log: (line: string) => void = () => {},
  realpathFn: (path: string) => Promise<string> = realpath
): Promise<FocusedWorkspace | { view: WorkspaceView }> {
  const context = await call('workspace.readContext', {})
  const id = context?.workspaceId
  if (!context || !id) return { view: { status: 'none' } }

  const { workspaces, truncated } = await call('workspace.list', {})
  const row = workspaces.find((candidate) => candidate.id === id)
  if (!row) {
    // La liste de l'hôte est plafonnée : l'espace focalisé peut en être sorti sans avoir disparu.
    if (truncated) log('workspace not found in a truncated workspace.list, treated as none')
    return { view: { status: 'none' } }
  }
  // La forme du chemin se journalise avant tout retour anticipé : c'est elle qui explique un espace refusé, jamais le chemin.
  const shape = classifyRoot(row.path, platform)
  log(`workspace root shape=${shape}`)
  if (isRemoteHost(row.hostId)) return { view: { status: 'remote' } }
  // Sous Windows, une racine `/…` est celle d'une distribution WSL : le worker ne la lit pas.
  if (platform === 'win32' && shape === 'posix') return { view: { status: 'wsl' } }

  const real = await realpathFn(row.path).catch(() => null)
  if (real === null) return { view: { status: 'missing' } }
  if (real === (await realpathFn(home).catch(() => home))) return { view: { status: 'home' } }

  return {
    root: row.path,
    projectKey: row.projectId ?? row.id,
    view: {
      status: 'ready',
      id: row.id,
      name: row.name,
      branch: row.branch ?? (context.branch === '' ? null : context.branch),
      linkedWorktree: await isLinkedWorktree(row.path),
      network: isNetworkPath(row.path, platform)
    }
  }
}
