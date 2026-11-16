// `orca plugin check` dessine le panneau une fois par scénario, en sombre puis en clair ; le worker est remplacé par un état figé.
import { defineCheck } from 'orca/testing'
import type { AgentView, PanelState } from './protocol'
import type { CopyKind } from './scan'
import type { ManagedDir } from './skill-dirs'
import type { SkillRow } from './visibility'

const AGENTS: AgentView[] = [
  { id: 'claude', label: 'Claude', icon: 'agent-icons/claude.png', trust: null },
  { id: 'codex', label: 'Codex', icon: 'agent-icons/codex.png', trust: null },
  { id: 'grok', label: 'Grok', icon: 'agent-icons/grok.png', trust: null },
  { id: 'opencode', label: 'OpenCode', icon: 'agent-icons/opencode.png', trust: null },
  { id: 'pi', label: 'Pi', icon: 'agent-icons/pi.png', trust: null },
  { id: 'antigravity', label: 'Antigravity', icon: 'agent-icons/antigravity.png', trust: null },
  { id: 'dsh', label: 'DeepSeek Harness', icon: 'agent-icons/dsh.png', trust: null }
]

/** Qui lit quel dossier, pour les sept agents de Romain. */
const READERS: Record<ManagedDir, string[]> = {
  '.agents/skills': ['codex', 'opencode', 'pi', 'antigravity', 'dsh'],
  '.claude/skills': ['claude', 'opencode'],
  '.grok/skills': ['grok'],
  '.kiro/skills': [],
  '.qoder/skills': [],
  '.codebuddy/skills': [],
  '.zcode/skills': [],
  '.trae/skills': [],
  '.openclaude/skills': [],
  '.prime/agent/skills': []
}

function row(folder: string, description: string, source: SkillRow['source'], copies: [ManagedDir, string][], excluded: string[] = []): SkillRow {
  const seeing = new Set(copies.flatMap(([dir]) => READERS[dir]))
  const agents = AGENTS.map((agent) => ({
    agent: agent.id,
    state: seeing.has(agent.id) ? ('sees' as const) : excluded.includes(agent.id) ? ('excluded' as const) : ('absent' as const),
    via: copies.map(([dir]) => dir).filter((dir) => READERS[dir].includes(agent.id))
  }))
  const hashes = [...new Set(copies.map(([, hash]) => hash))]
  return {
    folder,
    displayName: folder,
    description,
    source,
    agents,
    missingFor: agents.filter((a) => a.state === 'absent').map((a) => a.agent),
    excluded: agents.filter((a) => a.state === 'excluded').map((a) => a.agent),
    versions: hashes.map((hash) => ({ hash, dirs: copies.filter(([, each]) => each === hash).map(([dir]) => dir) })),
    copies: copies.map(([dir]) => ({ dir, kind: 'dir' as CopyKind, feeds: READERS[dir], linkedFrom: [] }))
  }
}

const READY_ROWS: SkillRow[] = [
  row('sonniss-catalog-audio-fx', 'Catalogue de sons pour le montage', { kind: 'local', path: '~/dev/motion-design-tools/plugin/skills' }, [
    ['.agents/skills', 'a'],
    ['.claude/skills', 'a'],
    ['.grok/skills', 'a']
  ]),
  row('motion-context', 'Contexte des projets de motion design', { kind: 'handwritten' }, [['.claude/skills', 'b']], ['grok']),
  // Deux contenus distincts : le bandeau de divergence.
  row('frontend-design', 'Interfaces soignées', { kind: 'remote', source: 'anthropics/skills' }, [
    ['.claude/skills', 'c1'],
    ['.agents/skills', 'c2']
  ])
]

function stateOf(overrides: Partial<PanelState>): PanelState {
  return {
    workspace: { status: 'ready', id: 'identity:idema', name: 'erom-tool-idema', branch: 'feat/skills', linkedWorktree: true },
    agents: AGENTS,
    inventory: 'detected',
    rows: READY_ROWS,
    unsafeDirs: [],
    lockUnreadable: false,
    capabilities: { trash: true, folderPicker: true },
    busy: null,
    ...overrides
  }
}

const SCENARIOS: Record<string, PanelState> = {
  ready: stateOf({}),
  fallback: stateOf({ inventory: 'fallback', agents: [], rows: READY_ROWS.map((r) => ({ ...r, agents: [], missingFor: [], excluded: [] })) }),
  remote: stateOf({ workspace: { status: 'remote' }, rows: [] }),
  noWorkspace: stateOf({ workspace: { status: 'none' }, rows: [] })
}

/** Chaque état en sombre, puis en clair (c'est le thème clair qui sert les variantes d'icônes `on-light/`). */
export default defineCheck(
  Object.fromEntries(
    Object.entries(SCENARIOS).flatMap(([name, state]) =>
      (['dark', 'light'] as const).map((theme) => [theme === 'dark' ? name : `${name}Light`, { theme, requests: { 'state.get': state, 'state.refresh': state } }] as const)
    )
  )
)
