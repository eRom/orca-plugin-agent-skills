// Table des agents d'Orca : signaux de détection et icône, dans l'ordre du catalogue d'Orca (Réglages > Agents).
// Sources :
// - ordre et libellés : src/shared/agent-launch/catalog/tui-agent-display-names.ts (dépôt d'Orca, commit ed507d41f4d) ;
// - `libIds` : identifiants skills.sh, table relevée dans `remove.mjs` de `skills@1.8.1` le 2026-11-21 ;
// - `configDirs` : dossiers de config vérifiés sur source primaire, voir docs/agent-skill-dirs.md (section
//   « Config directories used for detection »). Sans source primaire : pas de dossier, pas de signal.

export type AgentSpec = {
  id: string
  label: string
  /** Identifiants skills.sh dont la détection par la bibliothèque prouve que l'agent est installé. */
  libIds: readonly string[]
  /** Dossiers de config relatifs au home, créés par l'agent (complément du plugin, sources primaires). */
  configDirs: readonly string[]
  /** Chemin de l'icône PNG, relatif à la racine du plugin. */
  icon: string
}

type Signals = { libIds?: readonly string[]; configDirs?: readonly string[] }

function agent(id: string, label: string, signals: Signals = {}): AgentSpec {
  return {
    id,
    label,
    libIds: signals.libIds ?? [],
    configDirs: signals.configDirs ?? [],
    icon: `agent-icons/${id}.png`
  }
}

/** Dans l'ordre du catalogue d'Orca (Réglages > Agents). */
export const AGENTS: readonly AgentSpec[] = [
  agent('claude', 'Claude', { libIds: ['claude-code'] }),
  // Pas de signal propre : le relier à `claude-code` doublerait la ligne Claude chez tout utilisateur de Claude.
  agent('claude-agent-teams', 'Claude Agent Teams'),
  agent('openclaude', 'OpenClaude', { configDirs: ['.openclaude'] }),
  agent('codex', 'Codex', { libIds: ['codex'] }),
  agent('grok', 'Grok', { libIds: ['grok'] }),
  agent('copilot', 'GitHub Copilot', { libIds: ['github-copilot'] }),
  agent('opencode2', 'OpenCode 2'),
  agent('opencode', 'OpenCode', { libIds: ['opencode'] }),
  agent('mimo-code', 'MiMo Code', { configDirs: ['.config/mimocode'] }),
  agent('ante', 'Ante', { configDirs: ['.ante'] }),
  agent('trae', 'Trae', { libIds: ['trae'] }),
  agent('muse', 'Muse'),
  agent('dsh', 'DeepSeek Harness', { configDirs: ['.dsh'] }),
  agent('qoder', 'Qoder CLI', { libIds: ['qoder'] }),
  agent('qoder-cn', 'Qoder CLI China', { libIds: ['qoder-cn'] }),
  agent('zcode', 'ZCode', { libIds: ['zcode'] }),
  agent('pi', 'Pi', { libIds: ['pi'] }),
  agent('omp', 'OMP', { configDirs: ['.omp'] }),
  agent('prime-agent', 'Prime Agent', { configDirs: ['.prime/agent'] }),
  agent('gemini', 'Gemini', { libIds: ['gemini-cli'] }),
  agent('antigravity', 'Antigravity', { libIds: ['antigravity-cli', 'antigravity'] }),
  // Aider ne lit pas de skills : il n'a besoin d'aucun signal.
  agent('aider', 'Aider'),
  agent('goose', 'Goose', { libIds: ['goose'] }),
  agent('amp', 'Amp', { libIds: ['amp'] }),
  agent('kilo', 'Kilocode', { libIds: ['kilo'] }),
  agent('kiro', 'Kiro', { libIds: ['kiro-cli'] }),
  agent('crush', 'Charm', { libIds: ['crush'] }),
  agent('aug', 'Auggie', { libIds: ['augment'] }),
  agent('autohand', 'Autohand Code', { libIds: ['autohand-code'] }),
  agent('cline', 'Cline', { libIds: ['cline'] }),
  agent('codebuff', 'Codebuff', { configDirs: ['.config/manicode'] }),
  agent('freebuff', 'Freebuff', { configDirs: ['.config/manicode'] }),
  agent('command-code', 'Command Code', { libIds: ['command-code'] }),
  agent('continue', 'Continue', { libIds: ['continue'] }),
  agent('cursor', 'Cursor', { libIds: ['cursor'] }),
  agent('droid', 'Droid', { libIds: ['droid'] }),
  agent('kimi', 'Kimi', { libIds: ['kimi-code-cli'] }),
  agent('mistral-vibe', 'Mistral Vibe', { libIds: ['mistral-vibe'] }),
  agent('qwen-code', 'Qwen Code', { libIds: ['qwen-code'] }),
  agent('rovo', 'Rovo Dev', { libIds: ['rovodev'] }),
  agent('hermes', 'Hermes', { libIds: ['hermes-agent'] }),
  agent('devin', 'Devin', { libIds: ['devin'] }),
  agent('openclaw', 'OpenClaw', { libIds: ['openclaw'] }),
  agent('codebuddy', 'CodeBuddy', { libIds: ['codebuddy'] }),
  agent('jcode', 'Jcode', { configDirs: ['.jcode'] })
]

/**
 * Les agents dont l'historique d'Orca (`agent.listSessions`) sait lire les sessions. Source : `orca search
 * --index-status --json`, champ `supportedAgents` (Orca 1.4.268) ; identique à `AI_VAULT_AGENTS` de
 * `out/shared/ai-vault/contracts/ai-vault-types.js` dans le bundle d'Orca, qui note aussi que le scanner range les
 * sessions OpenCode actuelles sous `opencode2`. À revérifier à chaque version d'Orca.
 */
export const HISTORY_AGENTS: ReadonlySet<string> = new Set([
  'claude',
  'codebuddy',
  'qoder',
  'codex',
  'hermes',
  'pi',
  'omp',
  'prime-agent',
  'cursor',
  'gemini',
  'antigravity',
  'rovo',
  'copilot',
  'opencode',
  'opencode2',
  'zcode',
  'grok',
  'openclaw',
  'devin',
  'droid',
  'cline',
  'kimi',
  'muse',
  'jcode',
  'kiro'
])

/**
 * Agents qui lisent des skills mais n'ont ni identifiant skills.sh ni dossier de config vérifié (hors Claude Agent
 * Teams, servi par la ligne Claude). Qu'ils soient dans `HISTORY_AGENTS` ou non : le plugin ne peut pas les détecter
 * par les dossiers. `opencode2` : son dossier `~/.config/opencode` est celui d'OpenCode, sans signal propre à la v2.
 * `muse` : aucune source primaire pour son dossier (docs/agent-skill-dirs.md).
 */
export const UNDETECTED_AGENTS: readonly string[] = ['opencode2', 'muse']

export function agentById(id: string): AgentSpec | undefined {
  return AGENTS.find((spec) => spec.id === id)
}

/** Identifiants triés par libellé, sans tenir compte de la casse : l'ordre de la section Agents et des pastilles. */
export function byLabel(ids: readonly string[]): string[] {
  const labelOf = (id: string): string => agentById(id)?.label ?? id
  return [...ids].sort((a, b) => labelOf(a).localeCompare(labelOf(b), 'en', { sensitivity: 'base' }))
}
