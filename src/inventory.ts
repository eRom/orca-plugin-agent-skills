// Inventaire des agents que l'utilisateur a activés dans Orca : réglages lus (en lecture seule) dans la
// base SQLite d'Orca, commandes cherchées par un shell de login. Reproduit la règle de détection d'Orca
// (src/main/preflight/installed-agent-detection.ts) : agent non désactivé, installé, dépendances présentes.
import { accessSync, constants, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { AGENTS } from './agents'
import { shellQuote, splitWords } from './shell-words'

export type OrcaSettings = { disabled: readonly string[]; overrides: Readonly<Record<string, string>> }
export type Inventory = { agents: string[]; settingsReadable: boolean; detectedAt: number }
export type ShellRunner = (script: string) => Promise<{ ok: boolean; stdout: string }>
export type InventoryDeps = {
  readSettings: () => OrcaSettings | null
  /** `onFallback` est appelé quand le shell de login a échoué et que la recherche est retombée sur le PATH. */
  findCommands: (tokens: readonly string[], onFallback?: () => void) => Promise<ReadonlySet<string>>
  now: () => number
}

export const ORCA_USER_DATA = join(homedir(), 'Library/Application Support/orca')

const PROBE_MARKER = '__AGENT_PROFILES__'
const SHELL_TIMEOUT_MS = 15_000

/** Premier mot d'un override de commande (`~/` développé), ou `null` pour une valeur vide. */
export function overrideToken(override: string | undefined): string | null {
  const first = splitWords(override ?? '')[0]?.value
  if (!first) return null
  return first.startsWith('~/') ? join(homedir(), first.slice(2)) : first
}

/** Tous les jetons à chercher : commandes et dépendances de la table, plus les overrides, sans doublon. */
export function probeTokens(settings: OrcaSettings | null): string[] {
  const tokens = new Set<string>()
  for (const agent of AGENTS) {
    for (const command of agent.commands) tokens.add(command)
    for (const command of agent.requiredCommands) tokens.add(command)
  }
  for (const override of Object.values(settings?.overrides ?? {})) {
    const token = overrideToken(override)
    if (token) tokens.add(token)
  }
  return [...tokens]
}

/** Agents retenus, dans l'ordre du catalogue d'Orca. Les `requiredCommands` s'appliquent toujours. */
export function enabledAgents(found: ReadonlySet<string>, settings: OrcaSettings | null): string[] {
  const disabled = new Set(settings?.disabled ?? [])
  return AGENTS.filter((agent) => {
    if (disabled.has(agent.id)) return false
    const token = overrideToken(settings?.overrides[agent.id])
    const installed = agent.commands.some((command) => found.has(command)) || (token !== null && found.has(token))
    return installed && agent.requiredCommands.every((command) => found.has(command))
  }).map((agent) => agent.id)
}

/** Une détection complète : l'inventaire, et les commandes trouvées pour le recalculer plus tard sans shell. */
export async function detectAgents(
  deps: InventoryDeps,
  onFallback?: () => void
): Promise<{ inventory: Inventory; found: ReadonlySet<string> }> {
  const settings = deps.readSettings()
  const found = await deps.findCommands(probeTokens(settings), onFallback)
  return { inventory: { agents: enabledAgents(found, settings), settingsReadable: settings !== null, detectedAt: deps.now() }, found }
}

export async function listEnabledAgents(deps: InventoryDeps): Promise<Inventory> {
  return (await detectAgents(deps)).inventory
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function asStringRecord(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const entries = Object.entries(value)
  return entries.every(([, item]) => typeof item === 'string') ? Object.fromEntries(entries as [string, string][]) : {}
}

/** Lit les réglages d'Orca sans jamais écrire ni lever : `null` dès qu'un maillon manque. */
export function readOrcaSettings(userDataDir: string = ORCA_USER_DATA): OrcaSettings | null {
  let db: DatabaseSync | null = null
  try {
    const index = JSON.parse(readFileSync(join(userDataDir, 'orca-profile-index.json'), 'utf8')) as { activeProfileId?: unknown }
    if (typeof index.activeProfileId !== 'string' || index.activeProfileId === '') return null
    db = new DatabaseSync(join(userDataDir, 'profiles', index.activeProfileId, 'profile-state.db'), { readOnly: true })
    const row = db.prepare("select payload from profile_state_documents where domain='settings'").get()
    if (!row) return null
    const payload = JSON.parse(String(row.payload)) as { disabledTuiAgents?: unknown; agentCmdOverrides?: unknown }
    if (!isStringArray(payload.disabledTuiAgents)) return null
    return { disabled: payload.disabledTuiAgents, overrides: asStringRecord(payload.agentCmdOverrides) }
  } catch {
    return null
  } finally {
    try {
      db?.close()
    } catch {
      // Fermeture best effort : la base est ouverte en lecture seule, rien à perdre.
    }
  }
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
  readSettings: () => readOrcaSettings(),
  findCommands: (tokens, onFallback) => findCommands(tokens, undefined, undefined, onFallback),
  now: Date.now
}
