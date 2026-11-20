// Inventaire des agents installés : commandes cherchées par un shell de login, rien d'autre. Les fichiers
// privés d'Orca ne sont jamais lus (demande de la revue de l'annuaire, issue #1) : un agent installé mais
// désactivé dans Orca est donc retenu. Reprend la règle d'installation d'Orca
// (src/main/preflight/installed-agent-detection.ts) : une commande de l'agent trouvée, dépendances présentes.
import { accessSync, constants } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { AGENTS } from './agents'
import { shellQuote } from './shell-words'

export type Inventory = { agents: string[]; detectedAt: number }
export type ShellRunner = (script: string) => Promise<{ ok: boolean; stdout: string }>
export type InventoryDeps = {
  /** `onFallback` est appelé quand le shell de login a échoué et que la recherche est retombée sur le PATH. */
  findCommands: (tokens: readonly string[], onFallback?: () => void) => Promise<ReadonlySet<string>>
  now: () => number
}

const PROBE_MARKER = '__AGENT_PROFILES__'
const SHELL_TIMEOUT_MS = 15_000

/** Tous les jetons à chercher : commandes et dépendances de la table, sans doublon. */
export function probeTokens(): string[] {
  const tokens = new Set<string>()
  for (const agent of AGENTS) {
    for (const command of agent.commands) tokens.add(command)
    for (const command of agent.requiredCommands) tokens.add(command)
  }
  return [...tokens]
}

/** Agents installés, dans l'ordre du catalogue d'Orca. Les `requiredCommands` s'appliquent toujours. */
export function installedAgents(found: ReadonlySet<string>): string[] {
  return AGENTS.filter(
    (agent) =>
      agent.commands.some((command) => found.has(command)) && agent.requiredCommands.every((command) => found.has(command))
  ).map((agent) => agent.id)
}

/** Une détection complète : l'inventaire, et les commandes trouvées pour le recalculer plus tard sans shell. */
export async function detectAgents(
  deps: InventoryDeps,
  onFallback?: () => void
): Promise<{ inventory: Inventory; found: ReadonlySet<string> }> {
  const found = await deps.findCommands(probeTokens(), onFallback)
  return { inventory: { agents: installedAgents(found), detectedAt: deps.now() }, found }
}

export async function listInstalledAgents(deps: InventoryDeps): Promise<Inventory> {
  return (await detectAgents(deps)).inventory
}

/** Ne lit que ce qui se trouve entre les deux premiers marqueurs : le reste est du bruit de profil shell. */
export function parseShellProbe(stdout: string): Set<string> | null {
  const first = stdout.indexOf(PROBE_MARKER)
  if (first === -1) return null
  const bodyStart = first + PROBE_MARKER.length
  const second = stdout.indexOf(PROBE_MARKER, bodyStart)
  if (second === -1) return null
  const names = new Set<string>()
  for (const line of stdout.slice(bodyStart, second).split('\n')) {
    const equals = line.indexOf('=')
    if (equals > 0) names.add(line.slice(0, equals))
  }
  return names
}

function probeScript(names: readonly string[]): string {
  const quoted = names.map(shellQuote).join(' ')
  return `print -r -- ${PROBE_MARKER}; for c in ${quoted}; do p=$(whence -p -- "$c" 2>/dev/null) && print -r -- "$c=$p"; done; print -r -- ${PROBE_MARKER}`
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

/** Repli sans shell : cherche chaque nom dans les dossiers du PATH. */
function searchPath(names: readonly string[], pathEnv: string): Set<string> {
  const directories = pathEnv.split(':').filter((directory) => directory !== '')
  return new Set(names.filter((name) => directories.some((directory) => isExecutable(join(directory, name)))))
}

/** Lance le script dans un shell de login (le PATH de l'utilisateur) ; `ok: false` en cas d'échec ou de délai dépassé. */
const runLoginShell: ShellRunner = (script) =>
  new Promise((resolve) => {
    let stdout = ''
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok, stdout })
    }
    try {
      const child = spawn('/bin/zsh', ['-ilc', script], { stdio: ['ignore', 'pipe', 'ignore'] })
      timer = setTimeout(() => {
        // SIGKILL : un zsh interactif ignore SIGTERM et resterait coincé après le délai.
        child.kill('SIGKILL')
        finish(false)
      }, SHELL_TIMEOUT_MS)
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString()
      })
      child.on('error', () => finish(false))
      child.on('close', (code) => finish(code === 0))
    } catch {
      finish(false)
    }
  })

export async function findCommands(
  tokens: readonly string[],
  runShell: ShellRunner = runLoginShell,
  pathEnv: string = process.env.PATH ?? '',
  onFallback?: () => void
): Promise<ReadonlySet<string>> {
  const found = new Set<string>()
  const names: string[] = []
  for (const token of new Set(tokens)) {
    if (token.includes('/')) {
      if (isExecutable(token)) found.add(token)
    } else {
      names.push(token)
    }
  }
  if (names.length === 0) return found
  const probe = await runShell(probeScript(names))
  const parsed = probe.ok ? parseShellProbe(probe.stdout) : null
  if (parsed === null) onFallback?.()
  const resolved = parsed ?? searchPath(names, pathEnv)
  for (const name of resolved) found.add(name)
  return found
}

export const REAL_INVENTORY_DEPS: InventoryDeps = {
  findCommands: (tokens, onFallback) => findCommands(tokens, undefined, undefined, onFallback),
  now: Date.now
}
