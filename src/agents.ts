// Table des agents d'Orca : commandes à détecter et icône, dans l'ordre du catalogue d'Orca (Réglages > Agents).
// Sources (dépôt d'Orca, commit ed507d41f4d) :
// - ordre et libellés : src/shared/agent-launch/catalog/tui-agent-display-names.ts ;
// - commandes : detectCmd et detectCmdAliases de src/shared/agent-launch/catalog/tui-agent-config.ts.

export type AgentSpec = {
  id: string
  label: string
  /** Commandes dont la présence prouve que l'agent est installé (detectCmd puis alias). */
  commands: readonly string[]
  /** Commandes qui doivent toutes exister en plus, sinon l'agent n'est pas utilisable. */
  requiredCommands: readonly string[]
  /** Chemin de l'icône PNG, relatif à la racine du plugin. */
  icon: string
}

type Overrides = Partial<Pick<AgentSpec, 'requiredCommands'>>

function agent(id: string, label: string, commands: readonly string[], overrides: Overrides = {}): AgentSpec {
  return {
    id,
    label,
    commands,
    requiredCommands: [],
    icon: `agent-icons/${id}.png`,
    ...overrides
  }
}

/** Dans l'ordre du catalogue d'Orca (Réglages > Agents). */
export const AGENTS: readonly AgentSpec[] = [
  agent('claude', 'Claude', ['claude']),
  agent('claude-agent-teams', 'Claude Agent Teams', ['orca', 'orca-dev', 'orca-ide'], { requiredCommands: ['claude'] }),
  agent('openclaude', 'OpenClaude', ['openclaude']),
  agent('codex', 'Codex', ['codex']),
  agent('grok', 'Grok', ['grok']),
  agent('copilot', 'GitHub Copilot', ['copilot']),
  agent('opencode2', 'OpenCode 2', ['opencode2']),
  agent('opencode', 'OpenCode', ['opencode']),
  agent('mimo-code', 'MiMo Code', ['mimo']),
  agent('ante', 'Ante', ['ante']),
  agent('trae', 'Trae', ['traecli']),
  agent('muse', 'Muse', ['muse']),
  agent('dsh', 'DeepSeek Harness', ['dsh-tui', 'dst'], { requiredCommands: ['dsh'] }),
  agent('qoder', 'Qoder CLI', ['qodercli', 'qoder']),
  agent('qoder-cn', 'Qoder CLI China', ['qoderclicn', 'qodercn']),
  agent('zcode', 'ZCode', ['zcode']),
  agent('pi', 'Pi', ['pi']),
  agent('omp', 'OMP', ['omp']),
  agent('prime-agent', 'Prime Agent', ['prime-agent']),
  agent('gemini', 'Gemini', ['gemini']),
  agent('antigravity', 'Antigravity', ['agy']),
  agent('aider', 'Aider', ['aider']),
  agent('goose', 'Goose', ['goose']),
  agent('amp', 'Amp', ['amp']),
  agent('kilo', 'Kilocode', ['kilo']),
  agent('kiro', 'Kiro', ['kiro-cli']),
  agent('crush', 'Charm', ['crush']),
  agent('aug', 'Auggie', ['auggie']),
  agent('autohand', 'Autohand Code', ['autohand']),
  agent('cline', 'Cline', ['cline']),
  agent('codebuff', 'Codebuff', ['codebuff']),
  agent('freebuff', 'Freebuff', ['freebuff']),
  agent('command-code', 'Command Code', ['command-code']),
  agent('continue', 'Continue', ['cn']),
  agent('cursor', 'Cursor', ['cursor-agent']),
  agent('droid', 'Droid', ['droid']),
  agent('kimi', 'Kimi', ['kimi', 'kimi-code']),
  agent('mistral-vibe', 'Mistral Vibe', ['vibe', 'mistral-vibe']),
  agent('qwen-code', 'Qwen Code', ['qwen']),
  agent('rovo', 'Rovo Dev', ['acli']),
  agent('hermes', 'Hermes', ['hermes']),
  agent('devin', 'Devin', ['devin']),
  agent('openclaw', 'OpenClaw', ['openclaw']),
  agent('codebuddy', 'CodeBuddy', ['codebuddy', 'cbc']),
  agent('jcode', 'Jcode', ['jcode'])
]

export function agentById(id: string): AgentSpec | undefined {
  return AGENTS.find((spec) => spec.id === id)
}
