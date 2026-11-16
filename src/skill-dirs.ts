// Dossiers de skills de projet : ceux que chaque agent d'Orca lit réellement, et ceux que le plugin gère.
// Source : docs/agent-skill-dirs.md (recherche du 2026-11-16, sources primaires). Seules les lectures vérifiées
// comptent : une lecture non vérifiée est traitée comme absente. À revérifier avant chaque release.

/** Les seuls dossiers que le plugin lit, liste, écrit ou supprime. Jamais le `skills/` racine. */
export const MANAGED_DIRS = [
  '.agents/skills',
  '.claude/skills',
  '.grok/skills',
  '.kiro/skills',
  '.qoder/skills',
  '.codebuddy/skills',
  '.zcode/skills',
  '.trae/skills',
  '.openclaude/skills',
  '.prime/agent/skills'
] as const

export type ManagedDir = (typeof MANAGED_DIRS)[number]

const AGENTS_DIR: ManagedDir = '.agents/skills'
const CLAUDE_DIR: ManagedDir = '.claude/skills'

/** Dossiers gérés lus par chaque agent d'Orca (`null` : l'agent ne gère pas les skills). */
export const AGENT_READS: Readonly<Record<string, readonly ManagedDir[] | null>> = {
  claude: [CLAUDE_DIR],
  'claude-agent-teams': [CLAUDE_DIR],
  openclaude: ['.openclaude/skills'],
  codex: [AGENTS_DIR],
  grok: ['.grok/skills'],
  copilot: [AGENTS_DIR, CLAUDE_DIR],
  opencode: [AGENTS_DIR, CLAUDE_DIR],
  opencode2: [AGENTS_DIR, CLAUDE_DIR],
  'mimo-code': [AGENTS_DIR],
  ante: [AGENTS_DIR, CLAUDE_DIR],
  trae: ['.trae/skills'],
  muse: [AGENTS_DIR, CLAUDE_DIR],
  dsh: [AGENTS_DIR],
  qoder: ['.qoder/skills'],
  'qoder-cn': ['.qoder/skills'],
  zcode: ['.zcode/skills'],
  pi: [AGENTS_DIR],
  omp: [AGENTS_DIR],
  'prime-agent': ['.prime/agent/skills'],
  gemini: [AGENTS_DIR],
  antigravity: [AGENTS_DIR],
  aider: null,
  goose: [AGENTS_DIR, CLAUDE_DIR],
  amp: [AGENTS_DIR, CLAUDE_DIR],
  kilo: [AGENTS_DIR],
  kiro: ['.kiro/skills'],
  crush: [AGENTS_DIR, CLAUDE_DIR],
  aug: [AGENTS_DIR, CLAUDE_DIR],
  autohand: [AGENTS_DIR, CLAUDE_DIR],
  cline: [AGENTS_DIR, CLAUDE_DIR],
  codebuff: [AGENTS_DIR, CLAUDE_DIR],
  freebuff: [AGENTS_DIR, CLAUDE_DIR],
  'command-code': [AGENTS_DIR],
  continue: [CLAUDE_DIR],
  cursor: [AGENTS_DIR, CLAUDE_DIR],
  droid: [AGENTS_DIR],
  kimi: [AGENTS_DIR],
  'mistral-vibe': [AGENTS_DIR],
  'qwen-code': [AGENTS_DIR],
  rovo: [AGENTS_DIR],
  hermes: [AGENTS_DIR],
  devin: [AGENTS_DIR],
  openclaw: [AGENTS_DIR],
  codebuddy: ['.codebuddy/skills'],
  jcode: [AGENTS_DIR, CLAUDE_DIR]
}

/** Agents qui ne lisent un dossier que sous condition : le dossier ne leur sert pas tant que la condition manque. */
export const TRUST_GATED: Readonly<Record<string, 'hermes' | 'vibe'>> = { hermes: 'hermes', 'mistral-vibe': 'vibe' }

/** Agent de la bibliothèque `skills` qui écrit chaque dossier (les autres dossiers sont copiés par le plugin). */
export const LIB_AGENT_BY_DIR: Readonly<Partial<Record<ManagedDir, string>>> = {
  '.agents/skills': 'universal',
  '.claude/skills': 'claude-code',
  '.grok/skills': 'grok',
  '.kiro/skills': 'kiro-cli',
  '.qoder/skills': 'qoder',
  '.codebuddy/skills': 'codebuddy',
  '.zcode/skills': 'zcode',
  '.trae/skills': 'trae'
}

/** Dossiers que la bibliothèque ne connaît pas : le plugin copie les fichiers lui-même. */
export const COPY_ONLY_DIRS: readonly ManagedDir[] = ['.openclaude/skills', '.prime/agent/skills']

/** Dossiers de repli quand aucun agent actif ne gère les skills. */
export const FALLBACK_DIRS: readonly ManagedDir[] = [AGENTS_DIR, CLAUDE_DIR]

/** Agents de la liste qui gèrent les skills (au moins un dossier lu), dans l'ordre reçu. */
export function skillCapable(agents: readonly string[]): string[] {
  return agents.filter((agent) => (AGENT_READS[agent] ?? []).length > 0)
}

/** Dossier où écrire pour qu'un agent voie les skills : `.agents` si lu, sinon `.claude`, sinon son premier dossier. */
export function targetDirOf(agent: string): ManagedDir | null {
  const reads = AGENT_READS[agent] ?? []
  if (reads.includes(AGENTS_DIR)) return AGENTS_DIR
  if (reads.includes(CLAUDE_DIR)) return CLAUDE_DIR
  return reads[0] ?? null
}

/** Union des dossiers cibles des agents, dans l'ordre de `MANAGED_DIRS`. */
export function writeSet(agents: readonly string[]): ManagedDir[] {
  const targets = new Set<ManagedDir>()
  for (const agent of agents) {
    const target = targetDirOf(agent)
    if (target) targets.add(target)
  }
  return MANAGED_DIRS.filter((dir) => targets.has(dir))
}

/** Agents de la liste qui lisent `dir`, dans l'ordre reçu. */
export function readers(dir: ManagedDir, agents: readonly string[]): string[] {
  return agents.filter((agent) => AGENT_READS[agent]?.includes(dir))
}
