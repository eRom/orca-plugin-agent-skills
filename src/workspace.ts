// Espace de travail focalisé : l'identifiant vient de `workspace.readContext`, le chemin et l'hôte de `workspace.list`.
import { lstat, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import type { OrcaWorkerApi } from 'orca/worker'

/** Le `call` typé du worker : seul point d'entrée vers l'hôte, injecté pour que les tests n'aient pas besoin d'Orca. */
export type HostCall = OrcaWorkerApi['host']['call']

export type WorkspaceView =
  | { status: 'none' | 'remote' | 'missing' | 'home' }
  | { status: 'ready'; name: string; branch: string | null; linkedWorktree: boolean }

/** `projectKey` : identifiant du projet (`projectId`), commun à tous ses worktrees ; l'identifiant de l'espace à défaut. */
export type FocusedWorkspace = { root: string; projectKey: string; view: WorkspaceView }

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
  log: (line: string) => void = () => {}
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
  if (isRemoteHost(row.hostId)) return { view: { status: 'remote' } }

  const real = await realpath(row.path).catch(() => null)
  if (real === null) return { view: { status: 'missing' } }
  if (real === (await realpath(home).catch(() => home))) return { view: { status: 'home' } }

  return {
    root: row.path,
    projectKey: row.projectId ?? row.id,
    view: {
      status: 'ready',
      name: row.name,
      branch: row.branch ?? (context.branch === '' ? null : context.branch),
      linkedWorktree: await isLinkedWorktree(row.path)
    }
  }
}
